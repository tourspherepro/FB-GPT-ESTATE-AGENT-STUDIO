
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Search, Trash2, Upload, CheckCircle2, XCircle, Building, KeyRound, Eye, EyeOff, Loader2, Users, Receipt, ShieldAlert, Repeat } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, onSnapshot, doc, serverTimestamp, deleteDoc, addDoc, updateDoc, getDoc, setDoc, writeBatch, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, useFirebase } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { httpsCallable } from 'firebase/functions';

type Role = "superadmin" | "admin" | "staff" | "user" | "agent";

interface User {
  uid: string;
  name: string;
  email: string;
  company: string;
  telephone: string;
  role: Role;
  permissions: string[];
  avatar: string;
  password?: string; // Not stored in Firestore
}

interface UserRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  telephone: string;
}

interface Company {
  id: string;
  name: string;
  website: string;
  logo: string;
  telephone: string;
  email: string;
}

interface HeroContent {
  headlineTop: string;
  headlineBottom: string;
  subtext: string;
  buttonPrimaryText: string;
  buttonPrimaryLink: string;
  buttonSecondaryText: string;
  buttonSecondaryLink: string;
  searchPlaceholder: string;
}

interface BrandingSettings {
    brandImage: string | null;
}

interface PricingPlan {
    id?: string;
    planName: string;
    planPrice: string;
    planSubtitle: string;
    features: string[];
    highlighted: boolean;
    ctaText: string;
    ctaLink: string;
}

interface CtaContent {
    headline: string;
    button1Text: string;
    button1Link: string;
    button2Text: string;
    button2Link: string;
}

interface PropertyType {
    id: string;
    name: string;
    createdAt: any;
}
  
interface RoomType {
    id: string;
    name: string;
    createdAt: any;
}


const allTools = [
  { id: 'ea-valuation', name: 'EA Valuation' },
  { id: 'ea-floor-plan-pro', name: 'EA Floor Plan Pro' },
  { id: 'ea-image-pro', name: 'EA Image Pro' },
  { id: 'ea-360', name: 'EA 360' },
  { id: 'ea-analyse', name: 'EA Analyse & Describe' },
  { id: 'socials', name: 'Socials' },
  { id: 'eacaller', name: 'EACALLER' },
  { id: 'outlook-voice-assistant', name: 'Outlook Voice Assistant' },
  { id: 'creator-studio', name: 'Creator Studio' },
  { id: 'ea-alto', name: 'EA-ALTO' },
];

function roleToRadio(role: Role | undefined): "admin" | "user" {
    if (role === "admin") return "admin";
    // staff and superadmin are treated as "user" in the radio UI
    // but the editing logic will handle the superadmin case separately.
    return "user";
}


export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, effectiveRole, loading: authLoading, isDesignMode } = useAuth();
  const { firestore: db, storage, functions } = useFirebase();
  
  const [activeTab, setActiveTab] = useState('user-requests');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showDeleteAllUsersDialog, setShowDeleteAllUsersDialog] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [roleRadio, setRoleRadio] = useState<"admin" | "user">("user");


  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editedCompany, setEditedCompany] = useState<Partial<Company> & { id?: string } | null>(null);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);


  const [searchQuery, setSearchQuery] = useState('');
  
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({ brandImage: null });


  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [isHeroLoading, setIsHeroLoading] = useState(false);

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  
  const [ctaContent, setCtaContent] = useState<CtaContent | null>(null);
  const [isCtaLoading, setIsCtaLoading] = useState(false);
  
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isTypesLoading, setIsTypesLoading] = useState(false);
  const [newPropertyType, setNewPropertyType] = useState('');
  const [newRoomType, setNewRoomType] = useState('');


  useEffect(() => {
    if (authLoading) return;
    
    const isAdmin = effectiveRole === 'admin' || effectiveRole === 'superadmin';
    
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "You do not have access to admin settings.",
        variant: "destructive"
      });
      router.push('/dashboard');
      return;
    }
  }, [effectiveRole, authLoading, router, toast]);

    const handleSaveUser = async () => {
        if (!selectedUser || !db) return;

        const desiredRole: Role = roleRadio === "admin" ? "admin" : "user";
        const currentRoleOnRecord = selectedUser.role ?? "user";

        // --- Role Update Logic ---
        if (desiredRole !== currentRoleOnRecord && currentRoleOnRecord !== "superadmin") {
            const updateUserRoleFn = httpsCallable(functions, "updateUserRoleFromAdminPanel");
            updateUserRoleFn({
                uid: selectedUser.uid,
                role: desiredRole,
            }).then(async () => {
                if (authUser) {
                    await authUser.getIdToken(true);
                }
                toast({
                    title: "Role Updated",
                    description: `${selectedUser.name}'s role has been changed.`,
                });
            }).catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: `callable:updateUserRoleFromAdminPanel`,
                    operation: 'write',
                    requestResourceData: { uid: selectedUser.uid, role: desiredRole },
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        }

        // --- Profile Data Update Logic (existing) ---
        if (editedUser) {
            const userDocRef = doc(db, 'users', selectedUser.uid);
            const dataToUpdate = {
                name: editedUser.name,
                company: editedUser.company,
                telephone: editedUser.telephone,
                permissions: editedUser.permissions
            };
            
            updateDoc(userDocRef, dataToUpdate).catch(error => {
                const permissionError = new FirestorePermissionError({ path: userDocRef.path, operation: 'update', requestResourceData: dataToUpdate });
                errorEmitter.emit('permission-error', permissionError);
            });
             toast({
                title: "Profile Data Saved",
                description: `Details for ${editedUser.name} have been updated.`,
             });
        }
    };


    const handleAddNewType = async (type: 'property' | 'room') => {
        if (!db) return;
        const collectionName = type === 'property' ? 'settings_propertyTypes' : 'settings_roomTypes';
        const name = type === 'property' ? newPropertyType.trim() : newRoomType.trim();
        const existingTypes = type === 'property' ? propertyTypes : roomTypes;
        
        if (!name) {
            toast({ variant: 'destructive', title: 'Name cannot be empty' });
            return;
        }
        if (existingTypes.some(t => t.name.toLowerCase() === name.toLowerCase())) {
            toast({ variant: 'destructive', title: 'Duplicate Name', description: 'This type already exists.' });
            return;
        }

        const collectionRef = collection(db, collectionName);
        try {
            await addDoc(collectionRef, { name: name, createdAt: serverTimestamp() });
            toast({ title: 'Success', description: `${type === 'property' ? 'Property' : 'Room'} type added.`});
            if (type === 'property') setNewPropertyType('');
            else setNewRoomType('');
        } catch (e) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: collectionName, operation: 'create', requestResourceData: { name } }));
        }
    };

    const handleDeleteType = async (id: string, collectionName: 'settings_propertyTypes' | 'settings_roomTypes') => {
        if (!db) return;
        if (!window.confirm('Are you sure you want to delete this type?')) return;
        const docRef = doc(db, collectionName, id);
        try {
            await deleteDoc(docRef);
            toast({ title: 'Success', description: 'Type deleted.' });
        } catch(e) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
        }
    };


  useEffect(() => {
    if (isDesignMode || (effectiveRole !== 'admin' && effectiveRole !== 'superadmin') || !db) return;

    setIsTypesLoading(true);
    const propTypesQuery = query(collection(db, 'settings_propertyTypes'), orderBy('name'));
    const unsubPropTypes = onSnapshot(propTypesQuery, snapshot => {
        setPropertyTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyType)));
        setIsTypesLoading(false);
    }, error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'settings_propertyTypes', operation: 'list' }));
        setIsTypesLoading(false);
    });

    const roomTypesQuery = query(collection(db, 'settings_roomTypes'), orderBy('name'));
    const unsubRoomTypes = onSnapshot(roomTypesQuery, async (snapshot) => {
        if (snapshot.empty) {
            // Pre-populate if empty
            const starterRooms = ["Living Room", "Lounge", "Sitting Room", "Dining Room", "Kitchen", "Bathroom", "Shower Room", "WC", "Utility Room", "Bedroom", "Master Bedroom", "Ensuite", "Study", "Office", "Conservatory", "Porch", "Hallway", "Landing", "Garage"];
            const batch = writeBatch(db);
            starterRooms.forEach(name => {
                const docRef = doc(collection(db, 'settings_roomTypes'));
                batch.set(docRef, { name, createdAt: serverTimestamp() });
            });
            try {
               await batch.commit();
            } catch(e) {
                // This might fail if another user triggers it at the same time, which is fine.
                // The onSnapshot will re-trigger with the new data anyway.
                console.warn("Could not pre-populate room types, may be a permissions issue or race condition.");
            }
        } else {
            setRoomTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoomType)));
        }
        setIsTypesLoading(false);
    }, error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'settings_roomTypes', operation: 'list' }));
        setIsTypesLoading(false);
    });


    return () => {
        unsubPropTypes();
        unsubRoomTypes();
    };

  }, [effectiveRole, db]);



  useEffect(() => {
    if (isDesignMode || (effectiveRole !== 'admin' && effectiveRole !== 'superadmin') || !db) return;

    const fetchBrandingContent = async () => {
        const docRef = doc(db, 'site_content', 'branding');
        getDoc(docRef).then(docSnap => {
            if (docSnap.exists()) {
                setBrandingSettings(docSnap.data() as BrandingSettings);
            } else {
                const defaultBranding: BrandingSettings = { brandImage: null };
                setDoc(docRef, defaultBranding).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({path: docRef.path, operation: 'create', requestResourceData: defaultBranding})));
            }
        }).catch(e => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'get' }));
        });
    }
    fetchBrandingContent();
  }, [effectiveRole, db]);


  useEffect(() => {
    if (isDesignMode || (effectiveRole !== 'admin' && effectiveRole !== 'superadmin') || !db) return;

    const fetchPricingContent = () => {
        const plansQuery = query(collection(db, 'pricingPlans'));
        const unsubPlans = onSnapshot(plansQuery, (snapshot) => {
            setPricingPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingPlan)));
        }, (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'pricingPlans', operation: 'list'}));
        });

        const ctaDocRef = doc(db, 'ctaSection', 'main');
        const unsubCta = onSnapshot(ctaDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setCtaContent(docSnap.data() as CtaContent);
            } else {
                 const defaultCta: CtaContent = {
                    headline: "Ready to grow your property business?",
                    button1Text: "Start Free Trial",
                    button1Link: "/signup",
                    button2Text: "Talk to Sales",
                    button2Link: "/contact"
                };
                setDoc(ctaDocRef, defaultCta).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'ctaSection/main', operation: 'create', requestResourceData: defaultCta})));
                setCtaContent(defaultCta);
            }
        }, (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'ctaSection/main', operation: 'get'}));
        });

        return () => {
            unsubPlans();
            unsubCta();
        };
    };

    fetchPricingContent();
  }, [effectiveRole, db]);

  
  useEffect(() => {
    if (isDesignMode || (effectiveRole !== 'admin' && effectiveRole !== 'superadmin') || !db) return;

    const fetchHeroContent = async () => {
      setIsHeroLoading(true);
      const docRef = doc(db, 'site_content', 'hero_section');
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists()) {
          setHeroContent(docSnap.data() as HeroContent);
        } else {
            const defaultContent: HeroContent = {
                headlineTop: "The AI Copilot for",
                headlineBottom: "Modern Estate Agents",
                subtext: "Streamline your workflow, generate stunning marketing content, and close deals faster with our suite of intelligent tools.",
                buttonPrimaryText: "Get Started Free",
                buttonPrimaryLink: "/signup",
                buttonSecondaryText: "Watch Demo",
                buttonSecondaryLink: "/demo",
                searchPlaceholder: "Search EASTUDIO for tools, features, or guides..."
            };
            setDoc(docRef, defaultContent).catch(error => {
                const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'create', requestResourceData: defaultContent });
                errorEmitter.emit('permission-error', permissionError);
            });
            setHeroContent(defaultContent);
        }
      }).catch(error => {
            const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'get' });
            errorEmitter.emit('permission-error', permissionError);
      }).finally(() => {
        setIsHeroLoading(false);
      });
    };

    fetchHeroContent();
  }, [effectiveRole, toast, db]);


    useEffect(() => {
        if (isDesignMode || (effectiveRole !== 'admin' && effectiveRole !== 'superadmin') || !db) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const usersQuery = query(collection(db, 'users'));
        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                ...doc.data(),
                uid: doc.id,
            } as User));
            setUsers(usersData);
            if (!selectedUser && usersData.length > 0) {
                setSelectedUser(usersData[0]);
            }
            setIsLoading(false); // Set loading to false once users are loaded
        }, (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list'}));
            setIsLoading(false);
        });

        const requestsQuery = query(collection(db, 'userRequests'));
        const unsubRequests = onSnapshot(requestsQuery, 
            (snapshot) => {
                setUserRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRequest)));
            }, 
            (error) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'userRequests', operation: 'list'}));
            }
        );

        const companiesQuery = query(collection(db, 'companies'));
        const unsubCompanies = onSnapshot(companiesQuery, 
            (snapshot) => {
                const companiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
                setCompanies(companiesData);
                if (!selectedCompany && companiesData.length > 0) {
                    setSelectedCompany(companiesData[0]);
                }
            }, 
            (error) => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'companies', operation: 'list'}));
            }
        );

        return () => {
            unsubUsers();
            unsubRequests();
            unsubCompanies();
        };
    }, [effectiveRole, db]);
  
  useEffect(() => {
    if (selectedUser) {
      setEditedUser(JSON.parse(JSON.stringify(selectedUser)));
      const role = selectedUser.role ?? 'user';
      setRoleRadio(roleToRadio(role));
    } else {
      setEditedUser(null);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (isCreatingCompany) {
      setSelectedCompany(null);
      setEditedCompany({ name: '', website: '', logo: '', telephone: '', email: '' });
      setActiveTab('user-company-settings');
    } else if (selectedCompany) {
      setEditedCompany(JSON.parse(JSON.stringify(selectedCompany)));
    } else {
      setEditedCompany(null);
    }
  }, [selectedCompany, isCreatingCompany]);

  useEffect(() => {
    if (activeTab !== 'user-company-settings' && isCreatingCompany) {
      setIsCreatingCompany(false);
      if (!selectedCompany && companies.length > 0) {
        setSelectedCompany(companies[0]);
      }
    }
  }, [activeTab, isCreatingCompany, selectedCompany, companies]);

    const handleOpenPlanForm = (plan: PricingPlan | null) => {
        setSelectedPlan(plan);
        setIsPlanFormOpen(true);
    };

    const handleCtaContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!ctaContent) return;
        const { id, value } = e.target;
        setCtaContent({ ...ctaContent, [id]: value });
    };

    const handleSaveCta = async () => {
        if (!ctaContent || !db) return;
        setIsCtaLoading(true);
        const docRef = doc(db, 'ctaSection', 'main');
        updateDoc(docRef, { ...ctaContent })
            .then(() => toast({ title: 'Success', description: 'CTA section updated.' }))
            .catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'ctaSection/main', operation: 'update', requestResourceData: ctaContent })))
            .finally(() => setIsCtaLoading(false));
    };


  const handleUserSelect = (user: User) => {
    setIsCreatingCompany(false);
    setSelectedUser(user);
    setActiveTab('user');
  };
  
  const handleCompanySelect = (company: Company) => {
    setIsCreatingCompany(false);
    setSelectedCompany(company);
    setActiveTab('user-company-settings');
  }

  const handleDeleteUser = async (userId: string) => {
    if (!db) return;
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        const userRef = doc(db, 'users', userId);
        deleteDoc(userRef).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
        toast({ title: 'User Deletion Initiated', description: 'The user removal process has started.'});
        if (selectedUser?.uid === userId) {
          setSelectedUser(users.length > 1 ? users.filter(u => u.uid !== userId)[0] : null);
        }
    }
  };

  const handleDeleteAllUsers = async () => {
    if (!db) return;
    setShowDeleteAllUsersDialog(false);
    toast({ title: 'Deleting all users...', description: 'This may take a moment.' });
    
    const usersToDelete = users.filter(u => u.uid !== authUser?.uid);
    let successCount = 0;
    
    for (const user of usersToDelete) {
        const userRef = doc(db, 'users', user.uid);
        deleteDoc(userRef)
          .then(() => {
            successCount++;
          })
          .catch((error) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    // Give a summary toast after attempting all deletions
    setTimeout(() => {
        if (successCount === usersToDelete.length && usersToDelete.length > 0) {
            toast({
                title: 'Deletion Complete',
                description: `Successfully deleted all ${successCount} user documents.`,
            });
        } else if (successCount > 0) {
             toast({
                variant: 'destructive',
                title: 'Partial Deletion',
                description: `Deleted ${successCount} of ${usersToDelete.length} user documents. Some deletions failed.`,
            });
        } else if (usersToDelete.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'Could not delete any user documents. Check permissions.',
            });
        } else {
            toast({
                title: 'No Users to Delete',
                description: 'There were no other user documents to delete.',
            });
        }
    }, 2000); // Delay to allow operations to complete
  };


  const handleDeleteCompany = async (companyId: string) => {
    if (!db) return;
    if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
        const companyRef = doc(db, 'companies', companyId);
        deleteDoc(companyRef).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: companyRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
        toast({ title: 'Company Deletion Initiated', description: 'The company removal process has started.'});
        if (selectedCompany?.id === companyId) {
          setSelectedCompany(companies.length > 1 ? companies.filter(c => c.id !== companyId)[0] : null);
        }
    }
  };

    const handleDeletePlan = async (planId: string) => {
        if (!db) return;
        if (window.confirm('Are you sure you want to delete this pricing plan?')) {
            const planRef = doc(db, 'pricingPlans', planId);
            await deleteDoc(planRef)
                .then(() => toast({ title: 'Plan Deleted', description: 'The pricing plan has been removed.' }))
                .catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `pricingPlans/${planId}`, operation: 'delete' })));
        }
    };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedUser) return;
    const { id, value } = e.target;
    setEditedUser({ ...editedUser, [id]: value });
  };
  
  const handleCompanyChangeForUser = (companyName: string) => {
    if (!editedUser) return;
    setEditedUser({ ...editedUser, company: companyName });
  };

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedCompany) return;
    const { id, value } = e.target;
    setEditedCompany({ ...editedCompany, [id]: value });
  };
  
  const handleHeroContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!heroContent) return;
    const { id, value } = e.target;
    setHeroContent({ ...heroContent, [id]: value });
  };


  const handleImageUpload = async (file: File, path: string, storageInstance: FirebaseStorage): Promise<string | null> => {
    setIsUploading(true);
    toast({ title: 'Uploading...', description: 'Your image is being uploaded.' });
    try {
      const storageRef = ref(storageInstance, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      toast({ title: 'Upload Successful', description: 'Image has been saved.' });
      return downloadURL;
    } catch (error) {
      console.error("Upload failed:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the image. Please check console for errors.' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCompanyLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editedCompany) {
      const file = e.target.files[0];
      const companyId = isCreatingCompany ? `new_${Date.now()}` : editedCompany.id;
      const downloadURL = await handleImageUpload(file, `logos/${companyId}/${file.name}`, storage);
      if (downloadURL) {
        setEditedCompany({ ...editedCompany, logo: downloadURL });
      }
    }
  };

  const handleBrandImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const downloadURL = await handleImageUpload(file, `branding/${file.name}`, storage);
      if (downloadURL) {
        setBrandingSettings(prev => ({...prev, brandImage: downloadURL}));
      }
    }
  };

  const handlePermissionChange = (permissionId: string, isChecked: boolean) => {
    if (!editedUser) return;
    const newPermissions = isChecked
      ? [...editedUser.permissions, permissionId]
      : editedUser.permissions.filter(p => p !== permissionId);
    setEditedUser({ ...editedUser, permissions: newPermissions });
  };
  
  const handleAllPermissionsChange = (isChecked: boolean) => {
    if (!editedUser) return;
    const newPermissions = isChecked ? allTools.map(t => t.id) : [];
    setEditedUser({ ...editedUser, permissions: newPermissions });
  };

  const handleNewCompanyClick = () => {
      setIsCreatingCompany(true);
  }

  const handleSaveCompany = async () => {
    if (!editedCompany || !editedCompany.name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Company name is required.' });
      return;
    }
    if (!db) return;
    
    if (isCreatingCompany) {
      const companyCollection = collection(db, 'companies');
      addDoc(companyCollection, editedCompany).then(() => {
          toast({ title: 'Company Created', description: `${editedCompany.name} has been added.` });
          setIsCreatingCompany(false);
      }).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
              path: 'companies',
              operation: 'create',
              requestResourceData: editedCompany
          });
          errorEmitter.emit('permission-error', permissionError);
      });
    } else if (editedCompany.id) {
      const { id, ...companyData } = editedCompany;
      const companyRef = doc(db, 'companies', id);
      updateDoc(companyRef, companyData).then(() => {
        toast({ title: 'Company Saved', description: `Changes for ${editedCompany.name} have been saved.` });
      }).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
              path: companyRef.path,
              operation: 'update',
              requestResourceData: companyData
          });
          errorEmitter.emit('permission-error', permissionError);
      });
    }
  };


  const handleSaveSettings = async () => {
    if (!db) return;
    const settingsDoc = doc(db, 'site_content', 'branding');
    setDoc(settingsDoc, brandingSettings, { merge: true }).then(() => {
        toast({
            title: 'Settings Saved',
            description: 'Your new settings have been saved.',
        });
    }).catch(error => {
         errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'site_content/branding', operation: 'update', requestResourceData: brandingSettings}));
    });
  };

  const handleSaveHeroContent = async () => {
    if (!heroContent || !db) return;
    setIsHeroLoading(true);
    const docRef = doc(db, 'site_content', 'hero_section');
    setDoc(docRef, heroContent, { merge: true })
      .then(() => {
        toast({
            title: 'Hero Content Updated',
            description: 'Your homepage has been updated successfully.',
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: heroContent
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsHeroLoading(false);
      });
  };


  const handleRequestAction = async (requestId: string, action: 'grant' | 'deny') => {
    if (!db) return;
    const request = userRequests.find(r => r.id === requestId);
    if (!request) return;
  
    if (action === 'grant') {
      try {
        // The signup function already handles profile creation and toasts
        // This functionality needs to be replaced by a cloud function to create user with claims
        toast({title: "Granting access..."})
      } catch (error: any) {
         // Signup function has its own error handling/toasts, but we can catch specific cases if needed
         console.error("Error during signup from request:", error);
      }
    }

    const requestRef = doc(db, 'userRequests', requestId);
    deleteDoc(requestRef).catch(error => {
      const permissionError = new FirestorePermissionError({ path: requestRef.path, operation: 'delete' });
      errorEmitter.emit('permission-error', permissionError);
    });
  
    if (action === 'deny') {
      toast({ title: 'Request Denied', description: `The request for ${request.name} has been denied.` });
    }
  };


  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserManagementTab = activeTab === 'user-requests' || activeTab === 'user';
  const showCompanyForm = editedCompany && (selectedCompany || isCreatingCompany);

  const areAllToolsSelected = editedUser && editedUser.role === 'user' && allTools.every(tool => editedUser.permissions.includes(tool.id));
  
  const targetRole = selectedUser?.role ?? "user";
  const canEditRole = !(targetRole === "superadmin" && effectiveRole !== "superadmin");


  if (isLoading || authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-4 mb-2">
        <Button variant="outline" size="icon" onClick={() => setShowExitDialog(true)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Admin Settings</h1>
      </div>
      <p className="text-muted-foreground mb-8">Manage user accounts and tool permissions.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
            <Card className="overflow-hidden">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={isUserManagementTab ? "Search by name or email..." : "Search companies..."}
                            className="pl-8" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex flex-col h-[calc(100vh-25rem)]">
                  <div className="overflow-y-auto">
                    {isUserManagementTab ? (
                      <>
                        <button onClick={() => router.push('/dashboard/users')} className={`w-full text-left p-4 border-b flex items-center gap-3 transition-colors hover:bg-muted/50`}>
                            <Users className="w-10 h-10 p-2 rounded-full bg-muted text-muted-foreground"/>
                            <div>
                                <p className="font-semibold text-sm">Manage All Users</p>
                                <p className={`text-xs text-muted-foreground`}>View, edit, and delete all users.</p>
                            </div>
                        </button>
                        {filteredUsers.map(user => (
                            <button key={user.uid} onClick={() => handleUserSelect(user)} className={`w-full text-left p-4 border-b flex items-center gap-3 transition-colors ${selectedUser?.uid === user.uid ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}>
                                <Image src={user.avatar || 'https://picsum.photos/seed/placeholder/100/100'} alt={user.name} width={40} height={40} className="rounded-full" />
                                <div>
                                    <p className="font-semibold text-sm">{user.name}</p>
                                    <p className={`text-xs ${selectedUser?.uid === user.uid ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{user.email}</p>
                                </div>
                            </button>
                        ))}
                      </>
                    ) : (
                      filteredCompanies.map(company => (
                        <button key={company.id} onClick={() => handleCompanySelect(company)} className={`w-full text-left p-4 border-b flex items-center gap-3 transition-colors ${selectedCompany?.id === company.id && !isCreatingCompany ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}>
                            {company.logo ? <Image src={company.logo} alt={company.name} width={40} height={40} className="rounded-md object-contain" /> : <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center"><Building className="w-5 h-5 text-muted-foreground"/></div> }
                            <div>
                                <p className="font-semibold text-sm">{company.name}</p>
                                <p className={`text-xs ${selectedCompany?.id === company.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{company.website}</p>
                            </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="mt-auto p-4 border-t">
                      <Button className="w-full" onClick={isUserManagementTab ? () => router.push('/signup') : handleNewCompanyClick}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          {isUserManagementTab ? 'New User' : 'New Company'}
                      </Button>
                  </div>
                </div>
            </Card>
        </div>

        <div className="md:col-span-2">
            <Tabs defaultValue="user-requests" className="w-full" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="bg-transparent border-b rounded-none p-0 mb-6 justify-start flex-wrap h-auto">
                    <TabsTrigger value="user-requests" className="bg-transparent text-muted-foreground rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2">User Requests</TabsTrigger>
                    <TabsTrigger value="user" className="bg-transparent text-muted-foreground rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2 ml-4">User</TabsTrigger>
                    <TabsTrigger value="user-company-settings" className="bg-transparent text-muted-foreground rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2 ml-4">Company Settings</TabsTrigger>
                     {(effectiveRole === 'admin' || effectiveRole === 'superadmin') && (
                        <>
                        <TabsTrigger value="homepage-content" className="bg-transparent text-muted-foreground rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2 ml-4">Homepage Content</TabsTrigger>
                        <TabsTrigger value="pricing-management" className="bg-transparent text-muted-foreground rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2 ml-4">Pricing</TabsTrigger>
                        </>
                    )}
                    <TabsTrigger value="properties" className="bg-transparent text-muted-foreground rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2 ml-4">Properties</TabsTrigger>
                    <TabsTrigger value="eatools-settings" className="bg-transparent text-muted-foreground rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2 ml-4">EASTUDIO Settings</TabsTrigger>
                </TabsList>
                 <TabsContent value="user-requests">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending User Requests</CardTitle>
                            <CardDescription>Review and approve or deny new user account requests.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {userRequests.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No pending user requests.</p>
                            ) : (
                                userRequests.map(request => (
                                    <Card key={request.id} className="p-4">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                            <div className="mb-4 sm:mb-0">
                                                <p className="font-semibold">{request.name}</p>
                                                <p className="text-sm text-muted-foreground">{request.email}</p>
                                                <p className="text-sm text-muted-foreground">{request.company} - {request.telephone}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleRequestAction(request.id, 'grant')}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4"/>
                                                    Grant Permission
                                                </Button>
                                                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleRequestAction(request.id, 'deny')}>
                                                    <XCircle className="mr-2 h-4 w-4"/>
                                                    Deny Permission
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="user">
                   {editedUser ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Edit User: {editedUser.name}</CardTitle>
                                <CardDescription>Update user details and permissions.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-lg text-foreground">User Details</h3>
                                  <div className="grid md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                      <Label htmlFor="name">Full Name</Label>
                                      <Input id="name" value={editedUser.name || ''} onChange={handleUserInputChange} />
                                      </div>
                                      <div className="space-y-2">
                                      <Label htmlFor="email">Email Address</Label>
                                      <Input id="email" value={editedUser.email || ''} onChange={handleUserInputChange} disabled/>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="company">Company</Label>
                                        <Select value={editedUser.company || ''} onValueChange={handleCompanyChangeForUser}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a company" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {companies.map(company => (
                                                    <SelectItem key={company.id} value={company.name}>
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                      <Label htmlFor="telephone">Telephone</Label>
                                      <Input id="telephone" value={editedUser.telephone || ''} onChange={handleUserInputChange} />
                                      </div>
                                      <div className="space-y-2 md:col-span-2">
                                          <Label htmlFor="password">Password</Label>
                                          <div className="relative">
                                              <Input 
                                                  id="password" 
                                                  type={showPassword ? 'text' : 'password'} 
                                                  value={editedUser.password || ''} 
                                                  onChange={handleUserInputChange} 
                                                  className="pr-10"
                                                  placeholder='Leave blank to keep unchanged'
                                              />
                                              <Button 
                                                  type="button"
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                                  onClick={() => setShowPassword(!showPassword)}
                                              >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                              </Button>
                                          </div>
                                      </div>
                                  </div>
                                </div>

                                 <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold text-lg text-foreground">User Role</h3>
                                    <fieldset disabled={!canEditRole}>
                                    <RadioGroup 
                                        value={roleRadio}
                                        onValueChange={(value) => setRoleRadio(value as 'admin' | 'user')}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="admin" id="role-admin" />
                                            <Label htmlFor="role-admin">Admin</Label>
                                            <p className="text-sm text-muted-foreground ml-4">- Full access to all tools and admin settings.</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="user" id="role-user" />
                                            <Label htmlFor="role-user">User</Label>
                                            <p className="text-sm text-muted-foreground ml-4">- Access to tools based on individual permissions.</p>
                                        </div>
                                    </RadioGroup>
                                    </fieldset>
                                    {!canEditRole && (
                                        <div className="flex items-center gap-2 p-3 border rounded-lg bg-amber-50 text-amber-800 border-amber-200 mt-2">
                                            <ShieldAlert className="h-5 w-5"/>
                                            <p className="text-sm font-medium">This user is a Super Admin. Their role cannot be edited.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-lg text-foreground">Tool Access</h3>
                                        {editedUser.role === 'user' && (
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`select-all-${editedUser.uid}`}
                                                        checked={!!areAllToolsSelected}
                                                        onCheckedChange={(checked) => handleAllPermissionsChange(!!checked)}
                                                    />
                                                    <Label htmlFor={`select-all-${editedUser.uid}`} className="text-sm font-normal">Select All</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`clear-all-${editedUser.uid}`}
                                                        checked={editedUser.permissions.length === 0}
                                                        onCheckedChange={(checked) => checked && handleAllPermissionsChange(false)}
                                                    />
                                                    <Label htmlFor={`clear-all-${editedUser.uid}`} className="text-sm font-normal">Clear All</Label>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {editedUser.role === 'admin' || editedUser.role === 'superadmin' ? (
                                        <p className="text-sm text-muted-foreground italic">Administrators have access to all tools by default.</p>
                                    ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {allTools.map(tool => (
                                            <div key={tool.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card-alt">
                                                <Checkbox 
                                                    id={`${editedUser.uid}-${tool.id}`} 
                                                    checked={editedUser.permissions.includes('all') || editedUser.permissions.includes(tool.id)}
                                                    onCheckedChange={(checked) => handlePermissionChange(tool.id, !!checked)}
                                                />
                                                <Label htmlFor={`${editedUser.uid}-${tool.id}`} className="text-sm font-normal">{tool.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                    )}
                                </div>
                                 <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold text-lg text-destructive">Danger Zone</h3>
                                    <div className="flex justify-between items-center p-4 border border-destructive rounded-lg bg-destructive/5">
                                        <div>
                                            <p className="font-semibold">Delete this user</p>
                                            <p className="text-sm text-muted-foreground">Once you delete a user, there is no going back. Please be certain.</p>
                                        </div>
                                        <Button variant="destructive" onClick={() => handleDeleteUser(editedUser.uid)} disabled={editedUser.role === 'superadmin'}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete User
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-6">
                                <Button onClick={handleSaveUser}>Save Changes</Button>
                            </CardFooter>
                        </Card>
                    ) : (
                      <Card className="flex items-center justify-center h-96">
                        <p className="text-muted-foreground">Select a user to see their details.</p>
                      </Card>
                    )}
                </TabsContent>
                <TabsContent value="user-company-settings">
                    {showCompanyForm ? (
                    <Card>
                        <CardHeader>
                          <div>
                            <CardTitle>{isCreatingCompany ? 'Create New Company' : `Company Settings: ${editedCompany?.name}`}</CardTitle>
                            <CardDescription>
                                {isCreatingCompany ? 'Enter the details for the new company.' : 'Configure company-wide settings, branding, and social media links.'}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-foreground">Company Details</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Company Name</Label>
                                        <Input id="name" value={editedCompany.name || ''} onChange={handleCompanyInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telephone">Telephone</Label>
                                        <Input id="telephone" value={editedCompany.telephone || ''} onChange={handleCompanyInputChange} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={editedCompany.email || ''} onChange={handleCompanyInputChange} />
                                    </div>
                                     <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input id="website" value={editedCompany.website || ''} onChange={handleCompanyInputChange} />
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold text-lg text-foreground">Company Logo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                        <div className="space-y-2">
                                            <label htmlFor="logo-upload" className="cursor-pointer">
                                                <div className="flex items-center justify-center h-[100px] w-full bg-muted/20 rounded-md border-2 border-dashed hover:bg-muted/50 transition-colors">
                                                    <div className="text-center text-sm text-muted-foreground p-4">
                                                      {isUploading ? <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" /> : <Upload className="w-6 h-6 mx-auto mb-2" />}
                                                      <p><span className="font-semibold text-primary">Click to upload</span><br /> or drag and drop</p>
                                                    </div>
                                                </div>
                                                <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleCompanyLogoChange} disabled={isUploading}/>
                                            </label>
                                        </div>
                                        {editedCompany.logo ? (
                                            <div className="md:col-span-2">
                                                <p className="text-sm font-medium mb-2">Current Logo:</p>
                                                <div className="relative w-[200px] h-[100px]">
                                                    <Image 
                                                        src={editedCompany.logo}
                                                        alt={`${editedCompany.name || 'Company'} Logo`} 
                                                        fill
                                                        className="rounded-md object-contain border p-2 bg-white"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                          <div className="md:col-span-2">
                                            <p className="text-sm text-muted-foreground">No logo uploaded.</p>
                                          </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {!isCreatingCompany && editedCompany.id && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold text-lg text-destructive">Danger Zone</h3>
                                    <div className="flex justify-between items-center p-4 border border-destructive rounded-lg bg-destructive/5">
                                        <div>
                                            <p className="font-semibold">Delete this company</p>
                                            <p className="text-sm text-muted-foreground">Once you delete a company, this action cannot be undone.</p>
                                        </div>
                                        <Button variant="destructive" onClick={() => handleDeleteCompany(editedCompany.id!)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Company
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex-col items-stretch gap-4">
                           <Button onClick={handleSaveCompany} disabled={isUploading}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isCreatingCompany ? 'Create Company' : 'Save Changes'}
                            </Button>
                            {isCreatingCompany && (
                                <Button variant="ghost" onClick={() => { setIsCreatingCompany(false); if (companies.length > 0) setSelectedCompany(companies[0])}}>Cancel</Button>
                            )}
                        </CardFooter>
                    </Card>
                    ) : (
                      <Card className="flex items-center justify-center h-96">
                        <p className="text-muted-foreground">Select a company to see its settings or create a new one.</p>
                      </Card>
                    )}
                </TabsContent>
                <TabsContent value="properties">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Property Types</CardTitle>
                                <CardDescription>Manage the types of properties available in the system.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {isTypesLoading ? <Loader2 className="animate-spin" /> : propertyTypes.map(type => (
                                    <div key={type.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                        <p>{type.name}</p>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => { /* TODO: Implement Edit */}}>Edit</Button>
                                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteType(type.id, 'settings_propertyTypes')}>Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="flex gap-2 w-full">
                                    <Input placeholder="New property type..." value={newPropertyType} onChange={(e) => setNewPropertyType(e.target.value)} />
                                    <Button onClick={() => handleAddNewType('property')}>Add</Button>
                                </div>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Room Types</CardTitle>
                                <CardDescription>Manage the types of rooms for floor plans and descriptions.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                                 {isTypesLoading ? <Loader2 className="animate-spin" /> : roomTypes.map(type => (
                                    <div key={type.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                        <p>{type.name}</p>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => { /* TODO: Implement Edit */}}>Edit</Button>
                                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteType(type.id, 'settings_roomTypes')}>Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                               <div className="flex gap-2 w-full">
                                    <Input placeholder="New room type..." value={newRoomType} onChange={(e) => setNewRoomType(e.target.value)} />
                                    <Button onClick={() => handleAddNewType('room')}>Add</Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                {(effectiveRole === 'admin' || effectiveRole === 'superadmin') && (
                  <TabsContent value="homepage-content">
                      <Card>
                          <CardHeader>
                              <CardTitle>Homepage Content Editor</CardTitle>
                              <CardDescription>
                                  Update the text and links displayed on the public homepage.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              {isHeroLoading ? (
                                  <div className="flex justify-center items-center h-64">
                                      <Loader2 className="w-8 h-8 animate-spin" />
                                  </div>
                              ) : heroContent ? (
                                  <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                              <Label htmlFor="headlineTop">Top Headline</Label>
                                              <Input id="headlineTop" value={heroContent.headlineTop} onChange={handleHeroContentChange} />
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="headlineBottom">Bottom Headline (Gradient)</Label>
                                              <Input id="headlineBottom" value={heroContent.headlineBottom} onChange={handleHeroContentChange} />
                                          </div>
                                      </div>
                                      <div className="space-y-2">
                                          <Label htmlFor="subtext">Subtext</Label>
                                          <Textarea id="subtext" value={heroContent.subtext} onChange={handleHeroContentChange} />
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                              <Label htmlFor="buttonPrimaryText">Primary Button Text</Label>
                                              <Input id="buttonPrimaryText" value={heroContent.buttonPrimaryText} onChange={handleHeroContentChange} />
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="buttonPrimaryLink">Primary Button Link</Label>
                                              <Input id="buttonPrimaryLink" value={heroContent.buttonPrimaryLink} onChange={handleHeroContentChange} />
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                              <Label htmlFor="buttonSecondaryText">Secondary Button Text</Label>
                                              <Input id="buttonSecondaryText" value={heroContent.buttonSecondaryText} onChange={handleHeroContentChange} />
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="buttonSecondaryLink">Secondary Button Link</Label>
                                              <Input id="buttonSecondaryLink" value={heroContent.buttonSecondaryLink} onChange={handleHeroContentChange} />
                                          </div>
                                      </div>
                                      <div className="space-y-2">
                                          <Label htmlFor="searchPlaceholder">Search Placeholder</Label>
                                          <Input id="searchPlaceholder" value={heroContent.searchPlaceholder} onChange={handleHeroContentChange} />
                                      </div>
                                  </div>
                              ) : (
                                  <p className="text-muted-foreground">Could not load hero content.</p>
                              )}
                          </CardContent>
                          <CardFooter>
                              <Button onClick={handleSaveHeroContent} disabled={isHeroLoading}>
                                  {isHeroLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Save Homepage Content
                              </Button>
                          </CardFooter>
                      </Card>
                  </TabsContent>
                )}
                 <TabsContent value="pricing-management">
                    {isPlanFormOpen ? (
                        <PricingPlanForm 
                            plan={selectedPlan} 
                            onClose={() => setIsPlanFormOpen(false)}
                            onSave={() => {
                                toast({ title: 'Success', description: `Pricing plan ${selectedPlan ? 'updated' : 'created'}.` });
                                setIsPlanFormOpen(false);
                            }}
                        />
                    ) : (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>Pricing Plan Management</CardTitle>
                                        <CardDescription>Add, edit, or delete pricing plans for your customers.</CardDescription>
                                    </div>
                                    <Button onClick={() => handleOpenPlanForm(null)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Plan
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pricingPlans.length > 0 ? (
                                    pricingPlans.map(plan => (
                                        <Card key={plan.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{plan.planName} {plan.highlighted && <span className="text-xs text-primary font-bold"> (POPULAR)</span>}</p>
                                                <p className="text-sm text-muted-foreground">{plan.planPrice}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" onClick={() => handleOpenPlanForm(plan)}>Edit</Button>
                                                <Button variant="destructive" onClick={() => plan.id && handleDeletePlan(plan.id)}>Delete</Button>
                                            </div>
                                        </Card>
                                    ))
                                ) : <p className="text-center text-muted-foreground py-4">No pricing plans found.</p>}
                            </CardContent>
                             <CardHeader>
                                <CardTitle>Call-to-Action Section</CardTitle>
                                <CardDescription>Manage the final call-to-action section on the pricing page.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {ctaContent ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="cta-headline">Headline</Label>
                                            <Input id="headline" value={ctaContent.headline} onChange={handleCtaContentChange} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label htmlFor="cta-button1-text">Button 1 Text</Label><Input id="button1Text" value={ctaContent.button1Text} onChange={handleCtaContentChange} /></div>
                                            <div className="space-y-2"><Label htmlFor="cta-button1-link">Button 1 Link</Label><Input id="button1Link" value={ctaContent.button1Link} onChange={handleCtaContentChange} /></div>
                                            <div className="space-y-2"><Label htmlFor="cta-button2-text">Button 2 Text</Label><Input id="button2Text" value={ctaContent.button2Text} onChange={handleCtaContentChange} /></div>
                                            <div className="space-y-2"><Label htmlFor="cta-button2-link">Button 2 Link</Label><Input id="button2Link" value={ctaContent.button2Link} onChange={handleCtaContentChange} /></div>
                                        </div>
                                    </>
                                ) : <Loader2 className="animate-spin" />}
                            </CardContent>
                             <CardFooter>
                                <Button onClick={handleSaveCta} disabled={isCtaLoading}>
                                    {isCtaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Save CTA Section
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </TabsContent>
                 <TabsContent value="eatools-settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>EASTUDIO Settings</CardTitle>
                            <CardDescription>
                                Manage application-wide settings and API keys.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-foreground">API Keys</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="gemini-api-key">Gemini API Key</Label>
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="h-5 w-5 text-muted-foreground" />
                                        <Input 
                                            id="gemini-api-key" 
                                            type="password" 
                                            placeholder="Enter your Gemini API Key" 
                                            value={geminiApiKey}
                                            onChange={(e) => setGeminiApiKey(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Your API key is stored locally and used for AI features.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4 pt-6 border-t">
                                <h3 className="font-semibold text-lg text-foreground">Branding</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand-image-upload">Brand Image</Label>
                                        <label htmlFor="brand-image-upload" className="cursor-pointer">
                                            <div className="flex items-center justify-center h-[100px] w-full bg-muted/20 rounded-md border-2 border-dashed hover:bg-muted/50 transition-colors">
                                                <div className="text-center text-sm text-muted-foreground p-4">
                                                    {isUploading ? <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" /> : <Upload className="w-6 h-6 mx-auto mb-2" />}
                                                    <p><span className="font-semibold text-primary">Click to upload</span></p>
                                                </div>
                                            </div>
                                            <input id="brand-image-upload" type="file" className="hidden" accept="image/*" onChange={handleBrandImageChange} disabled={isUploading}/>
                                        </label>
                                    </div>
                                    {brandingSettings.brandImage ? (
                                        <div className="md:col-span-2">
                                            <p className="text-sm font-medium mb-2">Image Preview:</p>
                                            <div className="relative w-[200px] h-[100px]">
                                                <Image 
                                                    src={brandingSettings.brandImage}
                                                    alt="Brand Image Preview" 
                                                    fill
                                                    className="rounded-md object-contain border p-2 bg-white"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="md:col-span-2 flex items-center justify-center h-[100px] bg-muted/20 rounded-md">
                                            <p className="text-sm text-muted-foreground">No brand image uploaded.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                             {(effectiveRole === 'superadmin') && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold text-lg text-destructive">Danger Zone</h3>
                                    <div className="flex justify-between items-center p-4 border border-destructive rounded-lg bg-destructive/5">
                                        <div>
                                            <p className="font-semibold">Delete All Users</p>
                                            <p className="text-sm text-muted-foreground">This will permanently delete all user documents from Firestore. This action cannot be undone.</p>
                                        </div>
                                        <Button variant="destructive" onClick={() => setShowDeleteAllUsersDialog(true)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete All Users
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveSettings} disabled={isUploading}>Save Settings</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Any unsaved changes will be lost. Are you sure you want to return to the dashboard?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteAllUsersDialog} onOpenChange={setShowDeleteAllUsersDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all user documents, except for your own admin account. This action cannot be undone. Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllUsers} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Delete All Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

const PricingPlanForm: React.FC<{plan: PricingPlan | null; onClose: () => void; onSave: () => void;}> = ({ plan, onClose, onSave }) => {
    const [formData, setFormData] = useState<PricingPlan>(plan || {
        planName: '', planPrice: '', planSubtitle: '', features: [], highlighted: false, ctaText: '', ctaLink: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const { firestore: db } = useFirebase();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, features: e.target.value.split('\n') }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, highlighted: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) return;
        setIsLoading(true);

        const dataToSave = { ...formData, features: formData.features.filter(f => f.trim() !== '') };
        
        try {
            if (plan?.id) { // Editing existing plan
                const planRef = doc(db, 'pricingPlans', plan.id);
                await updateDoc(planRef, dataToSave);
            } else { // Creating new plan
                await addDoc(collection(db, 'pricingPlans'), dataToSave);
            }
            onSave();
        } catch (error: any) {
            const path = plan?.id ? `pricingPlans/${plan.id}` : 'pricingPlans';
            const operation = plan?.id ? 'update' : 'create';
            errorEmitter.emit('permission-error', new FirestorePermissionError({path, operation, requestResourceData: dataToSave}));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>{plan ? 'Edit' : 'Add New'} Pricing Plan</CardTitle>
                    <CardDescription>Fill in the details for the pricing plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="planName">Plan Name</Label><Input id="planName" value={formData.planName} onChange={handleChange} required /></div>
                        <div className="space-y-2"><Label htmlFor="planPrice">Price</Label><Input id="planPrice" value={formData.planPrice} onChange={handleChange} required /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="planSubtitle">Subtitle</Label><Input id="planSubtitle" value={formData.planSubtitle} onChange={handleChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="features">Features (one per line)</Label><Textarea id="features" value={formData.features.join('\n')} onChange={handleFeaturesChange} rows={5} /></div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2"><Label htmlFor="ctaText">CTA Text</Label><Input id="ctaText" value={formData.ctaText} onChange={handleChange} required /></div>
                         <div className="space-y-2"><Label htmlFor="ctaLink">CTA Link</Label><Input id="ctaLink" value={formData.ctaLink} onChange={handleChange} required /></div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2"><Switch id="highlighted" checked={formData.highlighted} onCheckedChange={handleSwitchChange} /><Label htmlFor="highlighted">Highlight this plan (Most Popular)</Label></div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Save Plan</Button>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </CardFooter>
            </form>
        </Card>
    )
}

    

    
