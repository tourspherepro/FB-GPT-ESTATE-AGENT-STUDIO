'use client';

import { CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, Pencil, X, Loader2, Copy, AlertCircle, ShoppingCart, Trees, Search, ShieldCheck, XCircle, RotateCcw, Save, Wand2, Repeat, Home } from 'lucide-react';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { analyzeRealEstateData, LocalSummary } from '@/ai/flows/analyze-real-estate-data';
import { analyzeFloorPlan, MeasurementData } from '@/ai/flows/analyze-floor-plan';
import { clientPostcodeLookup } from '@/ai/flows/client-postcode-lookup';
import { epcSearch, fetchCertificateDetailsClient } from '@/ai/flows/epc-lookup';
import { describeRoomsFromPhotos } from '@/ai/flows/describe-rooms-from-photos';
import { generateBrochure } from '@/ai/flows/generate-brochure-flow';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogExitDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogExitTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { safeParseInt, getRatingColor, getRatingTextColor } from '@/lib/epcUtils';
import EpcStandardGraph from '@/components/epc-standard-graph';
import { lookupConservationArea, type ConservationAreaResult } from '@/ai/flows/conservation-area-lookup';
import ReactMarkdown from 'react-markdown';
import { Progress } from '@/components/ui/progress';
import { generateValuationReport } from '@/ai/flows/generate-valuation-report';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { runAltoUpdate, AltoUpdateOutput } from '@/ai/flows/alto-update-flow';
import { useFirebase } from '@/firebase';

type FileWithPreview = File & { preview: string };

type PostcodeData = {
  parish?: string;
  admin_ward?: string;
  admin_district?: string;
  parliamentary_constituency?: string;
  region?: string;
};

type RoomDescription = {
  roomName: string;
  description: string;
};

type Project = {
  id: string;
  userId: string;
  isAdmin: boolean;
  projectName: string;
  createdAt: any;
  address: string;
  postcode: string;
  propertyType: string;
  bedrooms: string;
  receptionRooms: string;
  bathrooms: string;
  purchaseStyles: string[];
  councilTaxBand?: string;
  propertyPhotoUrls: string[];
  floorplanUrl?: string | null;
  adHighlights: string;
  adDescription: string;
  localSummary: (LocalSummary & { areaNameToSummarise?: string; isManualAreaEntry?: boolean }) | null;
  measurements: MeasurementData[];
  roomDescriptions: RoomDescription[];
  epcData?: any;
  conservationData?: ConservationAreaResult | null;
  valuationReport?: string | null;
  brochureContent?: string | null;
};

type GenerationStatus = {
  advert: 'pending' | 'success' | 'error' | 'skipped';
  localSummary: 'pending' | 'success' | 'error' | 'skipped';
  measurements: 'pending' | 'success' | 'error' | 'skipped';
  epc: 'pending' | 'success' | 'error' | 'skipped';
  conservation: 'pending' | 'success' | 'error' | 'skipped';
  valuation: 'pending' | 'success' | 'error' | 'skipped';
  roomDescriptions: 'pending' | 'success' | 'error' | 'skipped';
  brochure: 'pending' | 'success' | 'error' | 'skipped';
};

const propertyTypes = [
  'Detached',
  'Semi-detached',
  'Mid-Terrace',
  'End-Terrace',
  'Detached Bungalow',
  'Semi-detached bungalow',
  'Mid Terraced Bungalow',
  'End Terraced Bungalow',
  'Flats / Apartment',
  'Town House',
];

export default function EaAnalysePage() {
  const { user, userProfile, loading: authLoading, effectiveRole } = useAuth();
  const { firestore: db, storage } = useFirebase();
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState<string>('');
  const [receptionRooms, setReceptionRooms] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<string>('');
  const [purchaseStyles, setPurchaseStyles] = useState<string[]>([]);
  const [councilTaxBand, setCouncilTaxBand] = useState<string | undefined>(undefined);
  const [propertyPhotos, setPropertyPhotos] = useState<FileWithPreview[]>([]);
  const [floorplan, setFloorplan] = useState<FileWithPreview | null>(null);
  const [activeTab, setActiveTab] = useState('property-details');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveProgressMessage, setSaveProgressMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const [includeStreetNameDetail, setIncludeStreetNameDetail] = useState(false);
  const [onlyAdvert, setOnlyAdvert] = useState(false);
  const [onlyMeasurements, setOnlyMeasurements] = useState(false);

  const [postcodeData, setPostcodeData] = useState<PostcodeData | null>(null);
  const [postcodeOptions, setPostcodeOptions] = useState<{ value: string; label: string; key: string }[]>([]);
  const [isPostcodeLoading, setIsPostcodeLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [isManualAreaEntry, setIsManualAreaEntry] = useState(false);
  const [manualAreaName, setManualAreaName] = useState('');

  const [adHighlights, setAdHighlights] = useState('');
  const [adDescription, setAdDescription] = useState('');

  const [localSummary, setLocalSummary] = useState<(LocalSummary & { areaNameToSummarise?: string; isManualAreaEntry?: boolean }) | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [roomDescriptions, setRoomDescriptions] = useState<RoomDescription[]>([]);
  const [brochureContent, setBrochureContent] = useState<string | null>(null);

  const [adError, setAdError] = useState<string | null>(null);
  const [localSummaryError, setLocalSummaryError] = useState<string | null>(null);
  const [measurementsError, setMeasurementsError] = useState<string | null>(null);
  const [brochureError, setBrochureError] = useState<string | null>(null);
  const [roomDescriptionsError, setRoomDescriptionsError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<{ file: FileWithPreview; type: 'photo' | 'floorplan'; index?: number } | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const [epcPostcode, setEpcPostcode] = useState('');
  const [isEpcLoading, setIsEpcLoading] = useState(false);
  const [epcResults, setEpcResults] = useState<any[]>([]);
  const [epcError, setEpcError] = useState<string | null>(null);
  const [selectedEpc, setSelectedEpc] = useState<any | null>(null);

  const [conservationResult, setConservationResult] = useState<ConservationAreaResult | null>(null);
  const [isConservationLoading, setIsConservationLoading] = useState(false);
  const [conservationError, setConservationError] = useState<string | null>(null);

  const [valuationAddress, setValuationAddress] = useState('');
  const [isValuationLoading, setIsValuationLoading] = useState(false);
  const [valuationReport, setValuationReport] = useState<string | null>(null);
  const [valuationError, setValuationError] = useState<string | null>(null);

  const [isAltoExportOpen, setIsAltoExportOpen] = useState(false);
  const [altoAgentResponse, setAltoAgentResponse] = useState<AltoUpdateOutput | null>(null);
  const [isAltoAgentRunning, setIsAltoAgentRunning] = useState(false);

  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [projectsSearchQuery, setProjectsSearchQuery] = useState('');

  const saveAbortController = useRef<AbortController | null>(null);

  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[], type: 'photos' | 'floorplan') => {
      const filesWithPreview = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      if (type === 'photos') {
        setPropertyPhotos((prev) => [...prev, ...filesWithPreview]);
      } else {
        setFloorplan(filesWithPreview[0]);
      }
    },
    [setPropertyPhotos, setFloorplan]
  );

  useEffect(() => {
    return () => {
        propertyPhotos.forEach(file => URL.revokeObjectURL(file.preview));
        if (floorplan) {
            URL.revokeObjectURL(floorplan.preview);
        }
    };
  }, []);


  useEffect(() => {
    const postcodeRegex =
      /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})/;
    const matches = valuationAddress.match(postcodeRegex);

    if (matches && matches[0]) {
      const extractedPostcode = matches[0].toUpperCase();
      if (extractedPostcode !== postcode) {
        setPostcode(extractedPostcode);
      }
    }
  }, [valuationAddress]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (postcode.length > 5) {
        setIsPostcodeLoading(true);
        setPostcodeData(null);
        setSelectedArea('');
        setIsManualAreaEntry(false);
        setManualAreaName('');
        clientPostcodeLookup(postcode)
          .then((data) => {
            if (data && Object.keys(data).length > 0) {
              setPostcodeData(data);
              const order: (keyof PostcodeData)[] = ['admin_ward', 'parish', 'admin_district', 'parliamentary_constituency', 'region'];
              const uniqueOptions: { [key: string]: { value: string; label: string; key: string } } = {};

              order.forEach((key) => {
                const value = data[key];
                if (value && !uniqueOptions[value]) {
                  uniqueOptions[value] = { value, label: `${value} (${key.replace(/_/g, ' ')})`, key };
                }
              });

              const options = Object.values(uniqueOptions);
              setPostcodeOptions(options);

              const defaultSelection = options.find((opt) => opt.key === 'admin_ward');
              if (defaultSelection) {
                setSelectedArea(defaultSelection.value);
              } else if (options.length > 0) {
                setSelectedArea(options[0].value);
              }
            } else {
              toast({ variant: 'destructive', title: 'Postcode not found', description: 'Please check the postcode and try again.' });
            }
          })
          .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch postcode data.' }))
          .finally(() => setIsPostcodeLoading(false));
      } else {
        setPostcodeData(null);
        setPostcodeOptions([]);
        setSelectedArea('');
        setIsManualAreaEntry(false);
        setManualAreaName('');
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [postcode, toast]);

  const { getRootProps: getPhotosRootProps, getInputProps: getPhotosInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'photos'),
    accept: { 'image/png': [], 'image/jpeg': [], 'image/webp': [] },
  });

  const { getRootProps: getFloorplanRootProps, getInputProps: getFloorplanInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'floorplan'),
    accept: { 'image/png': [], 'image/jpeg': [], 'image/webp': [] },
    multiple: false,
  });

  const removeFile = (type: 'photo' | 'floorplan', index?: number) => {
    if (type === 'photo' && index !== undefined) {
      setPropertyPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setFloorplan(null);
    }
  };

  const openEditor = (file: FileWithPreview, type: 'photo' | 'floorplan', index?: number) => {
    setEditingFile({ file, type, index });
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingFile(null);
  };

  const onCrop = () => {
    if (!cropperRef.current) return;
    const cropper = cropperRef.current.cropper;
    cropper.getCroppedCanvas().toBlob((blob) => {
      if (blob && editingFile) {
        const newFile = new File([blob], editingFile.file.name, { type: blob.type }) as FileWithPreview;
        newFile.preview = URL.createObjectURL(blob);

        if (editingFile.type === 'photo' && editingFile.index !== undefined) {
          const newPhotos = [...propertyPhotos];
          newPhotos[editingFile.index] = newFile;
          setPropertyPhotos(newPhotos);
        } else if (editingFile.type === 'floorplan') {
          setFloorplan(newFile);
        }
        closeEditor();
      }
    });
  };

  const onRotate = (degree: number) => {
    if (!cropperRef.current) return;
    cropperRef.current.cropper.rotate(degree);
  };

  const handlePurchaseStyleChange = (style: string, checked: boolean) => {
    setPurchaseStyles((prev) => (checked ? [...prev, style] : prev.filter((s) => s !== style)));
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleRestart = () => {
    setShowRestartDialog(false);
    setPostcode('');
    setPropertyType('');
    setBedrooms('');
    setReceptionRooms('');
    setBathrooms('');
    setPurchaseStyles([]);
    setCouncilTaxBand(undefined);
    setPropertyPhotos([]);
    setFloorplan(null);
    setActiveTab('property-details');
    setAdHighlights('');
    setAdDescription('');
    setLocalSummary(null);
    setMeasurements([]);
    setRoomDescriptions([]);
    setBrochureContent(null);
    setGenerationStatus(null);
    setPostcodeData(null);
    setPostcodeOptions([]);
    setSelectedArea('');
    setIsManualAreaEntry(false);
    setManualAreaName('');
    setEpcPostcode('');
    setEpcResults([]);
    setSelectedEpc(null);
    setConservationResult(null);
    setValuationAddress('');
    setValuationReport(null);
    setValuationError(null);
    setOnlyAdvert(false);
    setOnlyMeasurements(false);
    setIncludeStreetNameDetail(false);
  };

  const handleGenerate = async () => {
    const areaToUse = isManualAreaEntry ? manualAreaName : selectedArea;
    const hasEnoughDataForAd = propertyType || bedrooms || bathrooms || receptionRooms;

    if (propertyPhotos.length === 0 && !floorplan && (!postcode || !areaToUse) && !hasEnoughDataForAd) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide some property details (e.g., photos, floorplan, postcode, or type/rooms) to generate content.',
      });
      return;
    }

    let runAd: boolean;
    let runLocalSummary: boolean;
    let runMeasurements: boolean;

    if (onlyAdvert) {
      runAd = true;
      runLocalSummary = false;
      runMeasurements = false;
    } else if (onlyMeasurements) {
      runAd = false;
      runLocalSummary = false;
      runMeasurements = true;
    } else {
      runAd = true;
      runLocalSummary = true;
      runMeasurements = true;
    }

    const hasFloorplan = !!floorplan;
    const hasPhotos = propertyPhotos.length > 0;
    const hasPostcodeAndArea = !!postcode && !!areaToUse;
    const hasPostcode = !!postcode;

    setIsLoading(true);
    setProgress(0);
    setProgressMessage('Preparing to generate...');
    setGenerationStatus({
      advert: 'skipped',
      localSummary: 'skipped',
      measurements: 'skipped',
      epc: 'skipped',
      conservation: 'skipped',
      valuation: 'skipped',
      roomDescriptions: 'skipped',
      brochure: 'skipped',
    });

    setAdError(null);
    setLocalSummaryError(null);
    setMeasurementsError(null);
    setEpcError(null);
    setConservationError(null);
    setBrochureError(null);
    setRoomDescriptionsError(null);

    const canRunAd = runAd && (propertyPhotos.length > 0 || hasEnoughDataForAd);
    const canRunLocalSummary = runLocalSummary && hasPostcodeAndArea;
    const canRunMeasurements = runMeasurements && hasFloorplan;
    const canRunEpc = hasPostcode;
    const canRunConservation = hasPostcode;
    const canRunBrochure = canRunAd || canRunMeasurements || canRunLocalSummary;

    const tasks: (() => Promise<void>)[] = [];

    let generatedLocalSummary: (LocalSummary & { areaNameToSummarise?: string; isManualAreaEntry?: boolean }) | undefined;
    let extractedMeasurements: MeasurementData[] = [];
    let generatedHighlights = '';
    let generatedDescription = '';
    let generatedRoomDescriptions: RoomDescription[] = [];
    let generatedBrochureContent: string | null = null;

    if (canRunLocalSummary) {
      tasks.push(async () => {
        setProgressMessage('Generating local summary...');
        setGenerationStatus((s) => (s ? { ...s, localSummary: 'pending' } : s));
        try {
          const result = await analyzeRealEstateData({
            runLocalSummary: true,
            runAd: false,
            areaNameToSummarise: areaToUse,
            postcode: postcode,
            includeStreetNameDetail: includeStreetNameDetail,
            photoDataUris: [],
          });
          if (result.localSummary) {
            generatedLocalSummary = {
              ...result.localSummary,
              areaNameToSummarise: areaToUse,
              isManualAreaEntry,
            };
            setLocalSummary(generatedLocalSummary);
            setGenerationStatus((s) => (s ? { ...s, localSummary: 'success' } : s));
          } else {
            setLocalSummaryError('Could not generate local summary.');
            setGenerationStatus((s) => (s ? { ...s, localSummary: 'error' } : s));
          }
        } catch (e) {
          console.error(e);
          setLocalSummaryError('An error occurred during local summary generation.');
          setGenerationStatus((s) => (s ? { ...s, localSummary: 'error' } : s));
        }
      });
    }
    
    if (canRunMeasurements) {
      tasks.push(async () => {
        setProgressMessage('Analyzing floorplan...');
        setGenerationStatus((s) => (s ? { ...s, measurements: 'pending' } : s));
        try {
          if (floorplan) {
            const base64 = await toBase64(floorplan);
            const result = await analyzeFloorPlan({ floorplanDataUri: base64 });
            if (result?.measurements) {
              extractedMeasurements = result.measurements;
              setMeasurements(result.measurements);
              setGenerationStatus((s) => (s ? { ...s, measurements: 'success' } : s));
            } else {
              setMeasurements([]);
              setMeasurementsError('The AI could not extract measurements from the floorplan.');
              setGenerationStatus((s) => (s ? { ...s, measurements: 'error' } : s));
            }
          }
        } catch (e: any) {
          console.error('Floorplan analysis failed.', e);
          setMeasurementsError(e.message || 'An unexpected error occurred during floorplan analysis.');
          setGenerationStatus((s) => (s ? { ...s, measurements: 'error' } : s));
        }
      });
    }

    if (canRunAd) {
      tasks.push(async () => {
        setProgressMessage('Generating property advert...');
        setGenerationStatus((s) => (s ? { ...s, advert: 'pending' } : s));
        try {
          const photoDataUris = await Promise.all(propertyPhotos.map((p) => toBase64(p)));
          const adResult = await analyzeRealEstateData({
            runAd: true,
            runLocalSummary: false,
            photoDataUris,
            propertyType,
            bedrooms,
            receptionRooms,
            bathrooms,
            purchaseStyles,
            councilTaxBand,
            epcRating: selectedEpc?.['current-energy-rating'],
            localSummary: generatedLocalSummary,
          });

          if (adResult?.propertyAdvert) {
            generatedHighlights = adResult.propertyAdvert.highlights;
            generatedDescription = adResult.propertyAdvert.description;
            setAdHighlights(generatedHighlights);
            setAdDescription(generatedDescription);
            setGenerationStatus((s) => (s ? { ...s, advert: 'success' } : s));
          } else {
            setAdError('Could not generate property advert.');
            setGenerationStatus((s) => (s ? { ...s, advert: 'error' } : s));
          }
        } catch (e: any) {
            console.error("Ad generation failed.", e);
            setAdError(e.message || 'An error occurred during ad generation.');
            setGenerationStatus((s) => (s ? { ...s, advert: 'error' } : s));
        }
      });
    }

    if (hasFloorplan && hasPhotos) {
      tasks.push(async () => {
        setProgressMessage('Generating room descriptions...');
        setGenerationStatus((s) => (s ? { ...s, roomDescriptions: 'pending' } : s));
        try {
          const roomNamesForDescription = extractedMeasurements.length > 0 
            ? extractedMeasurements.flatMap(floor => floor.rooms.map(room => room.roomName))
            : measurements.flatMap(floor => floor.rooms.map(room => room.roomName));

          if (roomNamesForDescription.length > 0) {
            const photoDataUris = await Promise.all(propertyPhotos.map((p) => toBase64(p)));
            const result = await describeRoomsFromPhotos({ photoDataUris, roomNames: roomNamesForDescription });
            generatedRoomDescriptions = result.descriptions;
            setRoomDescriptions(generatedRoomDescriptions);
            setGenerationStatus((s) => (s ? { ...s, roomDescriptions: 'success' } : s));
          } else {
             setGenerationStatus((s) => (s ? { ...s, roomDescriptions: 'success' } : s));
          }
        } catch(e: any) {
           console.error(e);
           setRoomDescriptionsError(e.message || 'An unexpected error occurred during room description generation.');
           setGenerationStatus((s) => (s ? { ...s, roomDescriptions: 'error' } : s));
        }
      });
    }

    if (canRunEpc) {
      tasks.push(async () => {
        setProgressMessage('Looking up EPC records...');
        setGenerationStatus((s) => (s ? { ...s, epc: 'pending' } : s));
        try {
          const results = await epcSearch({ postcode: postcode });
          if (results.certificates.length === 0) {
            setEpcError('No EPC records found for this postcode.');
            setGenerationStatus((s) => (s ? { ...s, epc: 'error' } : s));
          } else {
            const detailedCerts = await Promise.all(results.certificates.map((cert) => fetchCertificateDetailsClient(cert.lmkKey)));
            const uniqueCerts = Object.values(
              detailedCerts
                .filter(Boolean)
                .reduce((acc: any, cert: any) => {
                  const address = cert.address.toLowerCase();
                  if (!acc[address] || new Date(cert['assessment-date']) > new Date(acc[address]['assessment-date'])) {
                    acc[address] = cert;
                  }
                  return acc;
                }, {}),
            );
            setEpcResults(uniqueCerts as any[]);
            setEpcPostcode(postcode);
            setGenerationStatus((s) => (s ? { ...s, epc: 'success' } : s));
          }
        } catch (e: any) {
          console.error(e);
          setEpcError(e.message || 'An unexpected error occurred during EPC lookup.');
          setGenerationStatus((s) => (s ? { ...s, epc: 'error' } : s));
        }
      });
    }

    if (canRunConservation) {
      tasks.push(async () => {
        setProgressMessage('Checking conservation area status...');
        setGenerationStatus((s) => (s ? { ...s, conservation: 'pending' } : s));
        try {
          const result = await lookupConservationArea(postcode);
          setConservationResult(result);
          setGenerationStatus((s) => (s ? { ...s, conservation: 'success' } : s));
        } catch (error: any) {
          setConservationError(error.message || 'An unexpected error occurred.');
          setGenerationStatus((s) => (s ? { ...s, conservation: 'error' } : s));
        }
      });
    }
    
    if(canRunBrochure) {
        tasks.push(async () => {
            setProgressMessage('Generating property brochure...');
            setGenerationStatus(s => s ? { ...s, brochure: 'pending' } : s);
            try {
                const photoDataUris = await Promise.all(propertyPhotos.map(p => toBase64(p)));
                if(floorplan) {
                    photoDataUris.push(await toBase64(floorplan));
                }

                const result = await generateBrochure({
                    propertyAddress: valuationAddress,
                    photoDataUris: photoDataUris,
                    propertyType,
                    bedrooms,
                    receptionRooms,
                    bathrooms,
                    adHighlights: generatedHighlights || adHighlights,
                    adDescription: generatedDescription || adDescription,
                    measurements: extractedMeasurements.length > 0 ? extractedMeasurements : measurements,
                    localSummary: generatedLocalSummary || localSummary,
                    epcData: selectedEpc,
                });
                generatedBrochureContent = result.brochureMarkdown;
                setBrochureContent(result.brochureMarkdown);
                setGenerationStatus(s => s ? { ...s, brochure: 'success' } : s);
            } catch (e) {
                console.error(e);
                setBrochureError('An error occurred during brochure generation.');
                setGenerationStatus(s => s ? { ...s, brochure: 'error' } : s);
            }
        });
    }


    let completedTasks = 0;
    const totalTasks = tasks.length;
    
    for (const task of tasks) {
      await task();
      completedTasks++;
      setProgress((completedTasks / totalTasks) * 100);
    }
    
    setProgressMessage('All tasks completed!');
    setIsLoading(false);

    if (generatedHighlights || generatedDescription) {
      setActiveTab('advert-preview');
    } else if (generatedBrochureContent) {
      setActiveTab('brochure');
    } else if (extractedMeasurements.length > 0 || generatedRoomDescriptions.length > 0) {
      setActiveTab('rooms');
    } else if (generatedLocalSummary) {
      setActiveTab('local-area-info');
    }
  };

  const handleEpcLookup = async () => {
    if (!epcPostcode) {
      setEpcError('Please enter a postcode.');
      return;
    }
    setIsEpcLoading(true);
    setEpcResults([]);
    setEpcError(null);
    setSelectedEpc(null);
    setCouncilTaxBand(undefined);

    try {
      const results = await epcSearch({ postcode: epcPostcode });
      if (results.certificates.length === 0) {
        setEpcError('No EPC records found for this postcode.');
      } else {
        const detailedCerts = await Promise.all(results.certificates.map((cert) => fetchCertificateDetailsClient(cert.lmkKey)));
        const uniqueCerts = Object.values(
          detailedCerts
            .filter(Boolean)
            .reduce((acc: any, cert: any) => {
              const address = cert.address.toLowerCase();
              if (!acc[address] || new Date(cert['assessment-date']) > new Date(acc[address]['assessment-date'])) {
                acc[address] = cert;
              }
              return acc;
            }, {}),
        );
        setEpcResults(uniqueCerts as any[]);
      }
    } catch (error: any) {
      setEpcError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsEpcLoading(false);
    }
  };

  const handleSelectEpc = (certificate: any) => {
    setSelectedEpc(certificate);
    if (certificate['council-tax-band']) {
      setCouncilTaxBand(certificate['council-tax-band']);
    }
  };

  const handleConservationLookup = async () => {
    if (!postcode) {
      setConservationError('Please enter a postcode in the Property Details tab first.');
      return;
    }
    setIsConservationLoading(true);
    setConservationResult(null);
    setConservationError(null);

    try {
      const result = await lookupConservationArea(postcode);
      setConservationResult(result);
    } catch (error: any) {
      setConservationError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsConservationLoading(false);
    }
  };

  const handleGenerateValuation = async () => {
    if (!valuationAddress.trim()) {
      setValuationError('Please enter a property address.');
      return;
    }
    setIsValuationLoading(true);
    setValuationReport(null);
    setValuationError(null);
    try {
      const { report } = await generateValuationReport({ address: valuationAddress });
      setValuationReport(report);
    } catch (error: any) {
      console.error('Valuation Report Generation Failed:', error);
      setValuationError(error.message || 'An unexpected error occurred while generating the report.');
    } finally {
      setIsValuationLoading(false);
    }
  };

  const handlePrintValuation = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Valuation Report</title>');
      printWindow.document.write(
        '<style>body{font-family: sans-serif; padding: 2rem;} h1,h2,h3{color: #1e3a8a;} h3{border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 2rem;} ul{padding-left: 20px;} li{margin-bottom: 0.5rem;}</style>',
      );
      printWindow.document.write('</head><body>');
      const content = document.getElementById('valuation-report-content')?.innerHTML;
      if (content) {
        const printableContent = content.replace(/<h3>(.*?)<\/h3>/g, (match, p1) => `<h3>${p1.replace(/###\s*/, '')}</h3>`);
        printWindow.document.write(printableContent);
      }
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  const resizeImage = (file: Blob, maxSize: number = 1280): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > height) {
                if (width > maxSize) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas to Blob conversion failed'));
                },
                'image/jpeg',
                0.75
            );
            URL.revokeObjectURL(img.src);
        };
        img.onerror = (err) => reject(err);
    });
  };

  const uploadFile = async (file: Blob, path: string): Promise<string> => {
    if (!storage) throw new Error("Firebase Storage is not initialized.");
    const storageRef = ref(storage, path);
    const snap = await uploadBytes(storageRef, file);
    return getDownloadURL(snap.ref);
  };
  
  const handleSaveProject = async () => {
    if (!user || !userProfile || !db || !storage) {
        toast({ variant: 'destructive', title: 'Not authenticated or services not ready' });
        return;
    }
    if (!valuationAddress) {
        toast({
            variant: 'destructive',
            title: 'Project name required',
            description: 'Please enter a property address.',
        });
        return;
    }

    setIsSaving(true);
    setSaveProgress(0);
    setSaveProgressMessage("Starting save process...");
    saveAbortController.current = new AbortController();
    const signal = saveAbortController.current.signal;

    try {
        const totalPhotos = propertyPhotos.length;
        const uploadedPhotoUrls: string[] = [];
        for (let i = 0; i < totalPhotos; i++) {
            const file = propertyPhotos[i];
            if (signal.aborted) throw new Error('Save cancelled by user.');

            try {
                setSaveProgressMessage(`Resizing photo ${i + 1}...`);
                const resizedBlob = await resizeImage(file);
                if (signal.aborted) throw new Error('Save cancelled by user.');

                setSaveProgressMessage(`Uploading photo ${i + 1}...`);
                const uploadPath = `projects/${user.uid}/${Date.now()}_photo_${i}.jpg`;
                const url = await uploadFile(resizedBlob, uploadPath);
                uploadedPhotoUrls.push(url);
            } catch (uploadError: any) {
                console.error(`Failed to upload photo ${i + 1}:`, uploadError);
                throw uploadError;
            }
        }

        if (signal.aborted) throw new Error('Save cancelled by user.');

        let floorplanUrl: string | null = null;
        if (floorplan) {
            setSaveProgressMessage("Resizing floorplan...");
            const resized = await resizeImage(floorplan);
            if (signal.aborted) throw new Error('Save cancelled by user.');

            setSaveProgressMessage("Uploading floorplan...");
            const uploadPath = `projects/${user.uid}/${Date.now()}_floorplan.jpg`;
            floorplanUrl = await uploadFile(resized, uploadPath);
        }

        if (signal.aborted) throw new Error('Save cancelled by user.');
        
        setSaveProgressMessage("Saving project to database...");
        const projectData: Omit<Project, 'id'> = {
            userId: user.uid,
            isAdmin: effectiveRole === 'admin' || effectiveRole === 'superadmin',
            projectName: valuationAddress,
            createdAt: serverTimestamp(),
            address: valuationAddress,
            postcode: postcode ?? '',
            propertyType: propertyType ?? '',
            bedrooms: bedrooms ?? '',
            receptionRooms: receptionRooms ?? '',
            bathrooms: bathrooms ?? '',
            councilTaxBand: councilTaxBand ?? '',
            purchaseStyles: purchaseStyles ?? [],
            adHighlights: adHighlights ?? "",
            adDescription: adDescription ?? "",
            localSummary: localSummary ?? null,
            measurements: measurements ?? [],
            roomDescriptions: roomDescriptions ?? [],
            epcData: selectedEpc ?? null,
            conservationData: conservationResult ?? null,
            valuationReport: valuationReport ?? null,
            propertyPhotoUrls: uploadedPhotoUrls,
            floorplanUrl: floorplanUrl,
            brochureContent: brochureContent ?? null,
        };

        const projectRef = collection(db, "projects");
        await addDoc(projectRef, projectData);
        
        setSaveProgress(100);
        setSaveProgressMessage("Project saved!");
        toast({ title: "Saved!", description: `${valuationAddress} saved successfully.` });

    } catch (error: any) {
        if (error.name === 'AbortError' || error.message.includes('cancelled')) {
          toast({ variant: 'default', title: 'Save Cancelled' });
        } else if (error.code === 'permission-denied') {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'projects',
                operation: 'create',
                requestResourceData: { projectName: valuationAddress, userId: user.uid },
             }));
        } else {
            toast({
                variant: "destructive",
                title: "Failed to save project",
                description: error.message || "An unknown error occurred while saving."
            });
        }
    } finally {
        setTimeout(() => setIsSaving(false), 1200);
        saveAbortController.current = null;
    }
};

  const handleCancelSave = () => {
    if (saveAbortController.current) {
        saveAbortController.current.abort();
    }
  };


  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to Clipboard', description: `The ${type} has been copied.` });
  };

  const handleTriggerAltoUpdate = async () => {
    if (!valuationAddress) {
      toast({ variant: 'destructive', title: 'Address required', description: 'Please enter a property address.' });
      return;
    }
    setIsAltoAgentRunning(true);
    setAltoAgentResponse(null);
    setIsAltoExportOpen(true);
    try {
      const result = await runAltoUpdate({
        propertyAddress: valuationAddress,
        propertyDetails: {
          bedrooms: safeParseInt(bedrooms),
          bathrooms: safeParseInt(bathrooms),
          receptionRooms: safeParseInt(receptionRooms),
          propertyType: propertyType,
        },
        propertyDescription: adDescription,
        propertyHighlights: adHighlights
          .split('\n')
          .filter((h) => h.startsWith('*'))
          .map((h) => h.replace(/^\*\s*/, '')),
      });
      setAltoAgentResponse(result);
    } catch (error: any) {
      console.error('Alto Agent Error:', error);
      toast({ variant: 'destructive', title: 'Alto Agent Failed', description: error.message });
    } finally {
      setIsAltoAgentRunning(false);
    }
  };

  const isGenerateDisabled = (() => {
    if (isLoading) return true;
    const areaToUse = isManualAreaEntry ? manualAreaName : selectedArea;
    const hasEnoughData =
      propertyPhotos.length > 0 ||
      !!floorplan ||
      (!!postcode && !!areaToUse) ||
      !!propertyType ||
      !!bedrooms ||
      !!receptionRooms ||
      !!bathrooms;

    return !hasEnoughData;
  })();

  const sortRooms = (rooms: { roomName: string; dimensions?: string }[]) => {
    const preferredOrder = [
      'Landing',
      'Entrance Hall',
      'Hallway',
      'Bedroom',
      'En-suite',
      'Bathroom',
      'Shower Room',
      'WC',
      'Living Room',
      'Lounge',
      'Dining Room',
      'Kitchen',
      'Utility Room',
      'Garage',
      'Conservatory',
    ];

    return [...rooms].sort((a, b) => {
      const getBaseName = (name: string) => name.replace(/\s*\d+$/, '').trim();
      const getRoomNumber = (name: string) => {
        const match = name.match(/\d+$/);
        return match ? parseInt(match[0], 10) : Infinity;
      };

      const aBase = getBaseName(a.roomName);
      const bBase = getBaseName(b.roomName);

      let aIndex = preferredOrder.indexOf(aBase);
      let bIndex = preferredOrder.indexOf(bBase);

      if (a.roomName === 'Master Bedroom') aIndex = preferredOrder.indexOf('Bedroom');
      if (b.roomName === 'Master Bedroom') bIndex = preferredOrder.indexOf('Bedroom');

      if (aIndex > -1 && bIndex > -1) {
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
      }
      if (aIndex > -1 && bIndex === -1) return -1;
      if (bIndex > -1 && aIndex === -1) return 1;

      if (aBase === bBase) {
        if (a.roomName === 'Master Bedroom') return -1;
        if (b.roomName === 'Master Bedroom') return 1;
        return getRoomNumber(a.roomName) - getRoomNumber(b.roomName);
      }

      if (aBase < bBase) return -1;
      if (aBase > bBase) return 1;

      return 0;
    });
  };

  const fetchSavedProjects = async () => {
    if (!user || !db) return;

    setIsProjectsLoading(true);

    try {
        const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        const projects = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Project))
            .sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() ?? 0;
                const bTime = b.createdAt?.toMillis?.() ?? 0;
                return bTime - aTime;
            });

        setSavedProjects(projects);
    } catch (error: any) {
        console.error("Firestore error:", error);
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'projects', operation: 'list' }));
        } else if (error.code === 'unavailable') {
            toast({ variant: 'destructive', title: 'Offline', description: 'Could not fetch projects while offline.' });
        } else {
            toast({ variant: "destructive", title: "Failed to load projects", description: error.message || "Unknown error" });
        }
        setSavedProjects([]);
    } finally {
        setIsProjectsLoading(false);
    }
};

  useEffect(() => {
    if (activeTab === 'saved-properties') {
      fetchSavedProjects();
    }
  }, [activeTab, user]);

  const filteredProjects = savedProjects.filter((project) =>
    project.projectName.toLowerCase().includes(projectsSearchQuery.toLowerCase()),
  );

  const loadProject = (project: Project) => {
    handleRestart();
    setValuationAddress(project.address);
    setPostcode(project.postcode);
    setPropertyType(project.propertyType);
    setBedrooms(project.bedrooms);
    setReceptionRooms(project.receptionRooms);
    setBathrooms(project.bathrooms);
    setPurchaseStyles(project.purchaseStyles);
    setCouncilTaxBand(project.councilTaxBand);
    setAdHighlights(project.adHighlights);
    setAdDescription(project.adDescription);
    setLocalSummary(project.localSummary);
    setMeasurements(project.measurements);
    setRoomDescriptions(project.roomDescriptions || []);
    setSelectedEpc(project.epcData);
    setConservationResult(project.conservationData ?? null);
    setValuationReport(project.valuationReport ?? null);
    setBrochureContent(project.brochureContent || null);

    setGenerationStatus({
        advert: (project.adHighlights || project.adDescription) ? 'success' : 'skipped',
        localSummary: project.localSummary ? 'success' : 'skipped',
        measurements: project.measurements?.length > 0 ? 'success' : 'skipped',
        roomDescriptions: project.roomDescriptions?.length > 0 ? 'success' : 'skipped',
        epc: project.epcData ? 'success' : 'skipped',
        conservation: project.conservationData ? 'success' : 'skipped',
        valuation: project.valuationReport ? 'success' : 'skipped',
        brochure: project.brochureContent ? 'success' : 'skipped',
    });


    if (project.localSummary?.areaNameToSummarise) {
        if(project.localSummary.isManualAreaEntry) {
            setIsManualAreaEntry(true);
            setManualAreaName(project.localSummary.areaNameToSummarise);
        } else {
            setIsManualAreaEntry(false);
            setSelectedArea(project.localSummary.areaNameToSummarise);
        }
    }


    const photoFiles = project.propertyPhotoUrls.map((url, i) => ({
      name: `photo_${i}.jpg`,
      preview: url,
    })) as FileWithPreview[];
    setPropertyPhotos(photoFiles);

    if (project.floorplanUrl) {
      setFloorplan({
        name: 'floorplan.jpg',
        preview: project.floorplanUrl,
      } as FileWithPreview);
    }

    toast({ title: 'Project Loaded', description: `Successfully loaded '${project.projectName}'.` });
    setActiveTab('property-details');
  };

  const ImageThumb = ({
    file,
    onRemove,
    onEdit,
  }: {
    file: FileWithPreview;
    onRemove: () => void;
    onEdit: () => void;
  }) => (
    <div className="relative group aspect-video">
      <Image src={file.preview} alt={file.name} fill className={cn('rounded-lg', 'object-contain')} />
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}
      {!isLoading && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-lg">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onEdit}>
            <Pencil className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onRemove}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );

  const RatingBadge: React.FC<{ rating: string; score: number }> = ({ rating, score }) => {
    const ratingColor = getRatingColor(rating);
    const textColor = getRatingTextColor(rating);
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${ratingColor} ${textColor}`}>
        {rating.toUpperCase()} ({score})
      </span>
    );
  };
  
  const getExpiryDate = (lodgementDate: string) => {
    if (!lodgementDate) return null;
    const date = new Date(lodgementDate);
    date.setFullYear(date.getFullYear() + 10);
    return date;
    };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const EpcCardComponent: React.FC<{ record: any }> = ({ record }) => {
    if (!record) return null;
    const expiryDate = getExpiryDate(record['lodgement-date']);

    return (
      <Card className="flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base truncate" title={record.address}>
            {record.address}
          </CardTitle>
          <CardDescription className="text-xs flex justify-between items-center">
            <span>Assessed: {formatDate(record['assessment-date'])}</span>
            {expiryDate && <span>Expires: {formatDate(expiryDate)}</span>}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="my-2">
            <EpcStandardGraph
              currentValue={safeParseInt(record['current-energy-efficiency'])}
              potentialValue={safeParseInt(record['potential-energy-efficiency'])}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const getRoomDescription = (roomName: string): string => {
    const found = roomDescriptions.find(d => d.roomName.toLowerCase() === roomName.toLowerCase());
    return found ? found.description : 'A versatile space ready to be personalized.';
  };
  
  const titleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };


  const annualCostCurrent = selectedEpc
    ? safeParseInt(selectedEpc['lighting-cost-current']) +
      safeParseInt(selectedEpc['heating-cost-current']) +
      safeParseInt(selectedEpc['hot-water-cost-current'])
    : 0;

  const annualCostPotential = selectedEpc
    ? safeParseInt(selectedEpc['lighting-cost-potential']) +
      safeParseInt(selectedEpc['heating-cost-current']) +
      safeParseInt(selectedEpc['hot-water-cost-current'])
    : 0;

  const calculatedExpiryDate = selectedEpc ? getExpiryDate(selectedEpc['lodgement-date']) : null;
  const isEpcExpired = calculatedExpiryDate ? calculatedExpiryDate < new Date() : false;

  const highlightsArray = adHighlights
    .split('\n')
    .map(h => h.replace(/^\*\s*/, ''))
    .filter(h => h.trim() !== '');


  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto relative">
        {isLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-full max-w-md p-8 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">Generating Content...</h2>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {progressMessage || `${Math.round(progress)}% complete`}
              </p>
            </div>
          </div>
        )}
        {isSaving && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-full max-w-md p-8 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">Saving Project...</h2>
              <Progress value={saveProgress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {saveProgressMessage || `${Math.round(saveProgress)}% complete`}
              </p>
              <Button variant="secondary" onClick={handleCancelSave} className="mt-4">
                Cancel
              </Button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">EA Analyse &amp; Describe</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Generate compelling property marketing copy from photos, floorplans, and more.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent border-b rounded-none p-0 mb-6 justify-start flex-wrap h-auto">
            <TabsTrigger
              value="property-details"
              className="pb-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Property Details
            </TabsTrigger>
            <TabsTrigger
              value="advert-preview"
              className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Advert Preview
            </TabsTrigger>
            <TabsTrigger
              value="rooms"
              className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Rooms
            </TabsTrigger>
             <TabsTrigger
              value="brochure"
              className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Brochure
            </TabsTrigger>
            <TabsTrigger
              value="local-area-info"
              className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Local Area Info
            </TabsTrigger>
             <TabsTrigger
              value="property-checker"
              className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Property Checker
            </TabsTrigger>
            <TabsTrigger
              value="epc"
              className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              EPC
            </TabsTrigger>
            <TabsTrigger
              value="valuation"
              className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Valuation
            </TabsTrigger>
            <TabsTrigger
              value="saved-properties"
              className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Saved Properties
            </TabsTrigger>
          </TabsList>

          <Card className="rounded-2xl shadow-sm">
            <TabsContent value="property-details">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="space-y-2 flex-1 w-full">
                      <Label htmlFor="valuation-address">Property Address</Label>
                      <Input
                        id="valuation-address"
                        placeholder="e.g., 10 Downing Street, London, SW1A 2AA"
                        value={valuationAddress}
                        onChange={(e) => setValuationAddress(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Button size="lg" onClick={handleGenerate} disabled={isGenerateDisabled}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Generating...' : 'Generate Content'}
                      </Button>
                      <Button size="lg" variant="outline" onClick={handleSaveProject} disabled={isSaving || isGenerateDisabled}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Project'}
                      </Button>
                      <Button size="lg" variant="outline" onClick={() => setShowRestartDialog(true)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restart
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-3 space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <div className="relative">
                        <Input
                          id="postcode"
                          placeholder="e.g., SW1A 0AA"
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                        />
                        {isPostcodeLoading && (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      {postcodeOptions.length > 0 && (
                        <div className="pt-2">
                          <Label htmlFor="area-select">Area to Summarise</Label>
                          <Select
                            value={isManualAreaEntry ? '__manual__' : selectedArea}
                            onValueChange={(value) => {
                              if (value === '__manual__') {
                                setIsManualAreaEntry(true);
                                setSelectedArea('');
                              } else {
                                setIsManualAreaEntry(false);
                                setSelectedArea(value);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an area..." />
                            </SelectTrigger>
                            <SelectContent>
                              {postcodeOptions.map((opt) => (
                                <SelectItem key={opt.key} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                              <SelectItem value="__manual__">Enter manually...</SelectItem>
                            </SelectContent>
                          </Select>
                          {isManualAreaEntry ? (
                            <Input
                              id="manualArea"
                              placeholder="Enter area name"
                              value={manualAreaName}
                              onChange={(e) => setManualAreaName(e.target.value)}
                              className="mt-2"
                            />
                          ) : selectedArea ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              Using: <span className="font-semibold text-foreground">{selectedArea}</span>
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <Label>Property Type</Label>
                        <Select
                          onValueChange={(value) => {
                            setPropertyType(value);
                          }}
                          value={propertyType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {propertyTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>No. of Bedrooms</Label>
                        <Select onValueChange={setBedrooms} value={bedrooms}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(20)].map((_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>No. of Reception Rooms</Label>
                        <Select onValueChange={setReceptionRooms} value={receptionRooms}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(10)].map((_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>No. of Bathrooms</Label>
                        <Select onValueChange={setBathrooms} value={bathrooms}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(10)].map((_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-6 grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-foreground">Style of Purchase</h4>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="family-home"
                            checked={purchaseStyles.includes('Family Home')}
                            onCheckedChange={(checked) => handlePurchaseStyleChange('Family Home', !!checked)}
                          />
                          <Label htmlFor="family-home" className="font-normal">
                            Family Home
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="ftb"
                            checked={purchaseStyles.includes('First Time Buyer')}
                            onCheckedChange={(checked) => handlePurchaseStyleChange('First Time Buyer', !!checked)}
                          />
                          <Label htmlFor="ftb" className="font-normal">
                            First Time Buyer
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="investment"
                            checked={purchaseStyles.includes('Investment')}
                            onCheckedChange={(checked) => handlePurchaseStyleChange('Investment', !!checked)}
                          />
                          <Label htmlFor="investment" className="font-normal">
                            Investment
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="standard-auction"
                            checked={purchaseStyles.includes('Standard Auction')}
                            onCheckedChange={(checked) => handlePurchaseStyleChange('Standard Auction', !!checked)}
                          />
                          <Label htmlFor="standard-auction" className="font-normal">
                            Standard Auction
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="modern-auction"
                            checked={purchaseStyles.includes('Modern Method of Auction')}
                            onCheckedChange={(checked) => handlePurchaseStyleChange('Modern Method of Auction', !!checked)}
                          />
                          <Label htmlFor="modern-auction" className="font-normal">
                            Modern Method of Auction
                          </Label>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-foreground">Report Type</h4>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="include-street-detail"
                            checked={includeStreetNameDetail}
                            onCheckedChange={(checked) => setIncludeStreetNameDetail(!!checked)}
                          />
                          <Label htmlFor="include-street-detail" className="font-normal">
                            Include Street Name Detail
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="only-advert"
                            checked={onlyAdvert}
                            onCheckedChange={(checked) => {
                              setOnlyAdvert(!!checked);
                              if (!!checked) setOnlyMeasurements(false);
                            }}
                          />
                          <Label htmlFor="only-advert" className="font-normal">
                            Only Produce Advert Preview
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="only-measurements"
                            checked={onlyMeasurements}
                            onCheckedChange={(checked) => {
                              setOnlyMeasurements(!!checked);
                              if (!!checked) setOnlyAdvert(false);
                            }}
                          />
                          <Label htmlFor="only-measurements" className="font-normal">
                            Only Produce Measurements
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
                      <div className="space-y-2">
                        <Label htmlFor="portal-link">Portal Link</Label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input id="portal-link" placeholder="Search portal link..." className="pl-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label>Property Photos</Label>
                    {propertyPhotos.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setPropertyPhotos([])} className="text-destructive hover:text-destructive">
                        <X className="mr-2 h-4 w-4" />
                        Clear Photos
                      </Button>
                    )}
                  </div>
                  <div
                    {...getPhotosRootProps()}
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary"
                  >
                    <input {...getPhotosInputProps()} />
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag &amp; drop photos here, or click to select files</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                    </div>
                  </div>
                  {propertyPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {propertyPhotos.map((file, i) => (
                        <ImageThumb
                          key={`${file.name}-${i}`}
                          file={file}
                          onRemove={() => removeFile('photo', i)}
                          onEdit={() => openEditor(file, 'photo', i)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label>Floorplan (Optional)</Label>
                    {floorplan && (
                       <Button variant="ghost" size="sm" onClick={() => setFloorplan(null)} className="text-destructive hover:text-destructive">
                         <X className="mr-2 h-4 w-4" />
                         Clear Floorplan
                       </Button>
                    )}
                  </div>
                  {floorplan ? (
                    <div className="mt-2">
                      <ImageThumb
                        file={floorplan}
                        onRemove={() => removeFile('floorplan')}
                        onEdit={() => openEditor(floorplan, 'floorplan')}
                      />
                    </div>
                  ) : (
                    <div
                      {...getFloorplanRootProps()}
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary"
                    >
                      <input {...getFloorplanInputProps()} />
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drag &amp; drop floorplan here, or click to select file
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="rooms">
                <CardHeader>
                    <CardTitle>Rooms</CardTitle>
                    <CardDescription>Room measurements and AI-generated descriptions.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 min-h-[400px]">
                    {generationStatus?.measurements === 'pending' || generationStatus?.roomDescriptions === 'pending' ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-muted-foreground">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                                <p className="mt-4">Analyzing floorplan and photos...</p>
                            </div>
                        </div>
                    ) : measurementsError || roomDescriptionsError ? (
                        <div className="flex items-center justify-center h-full">
                            <Alert variant="destructive" className="max-w-md">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{measurementsError || roomDescriptionsError}</AlertDescription>
                            </Alert>
                        </div>
                    ) : measurements.length > 0 ? (
                        <div className="space-y-8">
                            {measurements.map((floor, floorIndex) => (
                                <div key={floorIndex}>
                                    <div className="flex items-center gap-3 mb-4 border-b pb-2">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(floor.floorName.toUpperCase(), 'Floor name')}>
                                          <Copy className="w-4 h-4 text-muted-foreground" />
                                      </Button>
                                      <h3 className="text-xl font-semibold text-foreground uppercase">{floor.floorName}</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {sortRooms(floor.rooms).map((room, roomIndex) => {
                                            const description = getRoomDescription(room.roomName);
                                            const textToCopy = `${titleCase(room.roomName)}${room.dimensions ? ` ${room.dimensions}` : ''}`;
                                            return (
                                                <div key={`${floorIndex}-${roomIndex}`} className="p-4 rounded-lg border bg-muted/20 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => copyToClipboard(textToCopy, 'Room details')}>
                                                            <Copy className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                        <h4 className="font-semibold text-lg">{titleCase(room.roomName)}</h4>
                                                        {room.dimensions && (
                                                            <Badge variant="secondary" className="font-mono text-sm">{room.dimensions}</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-start gap-3 pl-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(description, `${titleCase(room.roomName)} description`)}>
                                                            <Copy className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                        <p className="flex-1 text-sm text-muted-foreground pt-1">{description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground text-center">Upload a floorplan in the "Property Details" tab to generate rooms and measurements.</p>
                        </div>
                    )}
                </CardContent>
            </TabsContent>

            <TabsContent value="brochure">
                <CardHeader>
                    <CardTitle>AI-Generated Brochure</CardTitle>
                    <CardDescription>A complete property brochure generated from your data.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 min-h-[400px]">
                    {generationStatus?.brochure === 'pending' ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                            <p className="mt-4">Generating your brochure...</p>
                        </div>
                    ) : brochureError ? (
                        <Alert variant="destructive" className="max-w-md mx-auto my-auto">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{brochureError}</AlertDescription>
                        </Alert>
                    ) : brochureContent ? (
                        <div className="prose prose-slate dark:prose-invert max-w-none rounded-lg border p-6 bg-muted/20">
                            <ReactMarkdown>{brochureContent}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground text-center">Your generated brochure will appear here.</p>
                        </div>
                    )}
                </CardContent>
                {brochureContent && !isLoading && (
                    <CardFooter className="p-8 justify-end border-t">
                        <Button onClick={() => copyToClipboard(brochureContent, 'Brochure content')}>
                            <Copy className="mr-2 h-4 w-4" /> Copy Brochure Markdown
                        </Button>
                    </CardFooter>
                )}
            </TabsContent>

            <TabsContent value="advert-preview">
              <CardContent className="p-8 min-h-[400px]">
                {generationStatus?.advert === 'pending' ? (
                  <div className="text-center text-muted-foreground flex items-center justify-center h-full">
                    <div>
                      <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                      <p className="mt-4">Generating your advert...</p>
                    </div>
                  </div>
                ) : adError ? (
                  <div className="flex items-center justify-center h-full">
                    <Alert variant="destructive" className="max-w-md">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{adError}</AlertDescription>
                    </Alert>
                  </div>
                ) : adHighlights || adDescription ? (
                  <div className="w-full max-w-full">
                    <h3 className="text-xl font-bold text-foreground">Property Highlights</h3>
                    <ul className="mt-4 list-none pl-0 space-y-2">
                      {highlightsArray.map((line, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              copyToClipboard(line, 'Highlight')
                            }
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <span className="flex-1 uppercase text-sm font-medium tracking-wide text-foreground">
                            {line}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {adDescription && (
                      <div className="mt-8 pt-6 border-t">
                        <h3 className="text-xl font-bold text-foreground">Property Description</h3>
                        <ReactMarkdown
                          className="mt-4 prose-sm max-w-none"
                          components={{
                            p: ({ node, ...props }) => (
                              <p
                                className="text-sm text-foreground leading-relaxed"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {adDescription}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <p>
                        Upload property photos and generate content to see the advert preview.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              {(adHighlights || adDescription) && generationStatus?.advert !== 'pending' && (
                <CardFooter className="p-8 justify-between items-center border-t">
                  <div className="text-sm text-muted-foreground">
                    <span>
                      Description: ~{adDescription.split(' ').length} words
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => copyToClipboard(adDescription, 'description')}>
                      <Copy className="mr-2 h-4 w-4" /> Copy Description
                    </Button>
                    <Button variant="secondary" onClick={handleTriggerAltoUpdate}>
                      <Repeat className="mr-2 h-4 w-4" /> Export to Alto
                    </Button>
                  </div>
                </CardFooter>
              )}
            </TabsContent>

            <TabsContent value="local-area-info">
              <CardContent className="p-8 min-h-[400px]">
                       {generationStatus?.localSummary === 'pending' ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                                <p className="mt-4">Generating local summary...</p>
                            </div>
                        ) : localSummaryError ? (
                             <Alert variant="destructive" className="max-w-md mx-auto my-auto">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{localSummaryError}</AlertDescription>
                            </Alert>
                        ) : localSummary ? (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                                        <ShoppingCart className="w-5 h-5 text-primary"/>
                                        Local Amenities
                                    </h4>
                                    <p className="text-sm text-foreground">{localSummary.amenities}</p>
                                </div>
                                <div className="pt-4 border-t">
                                     <h4 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                                        <AlertCircle className="w-5 h-5 text-primary"/>
                                        Schools
                                    </h4>
                                    <p className="text-sm text-foreground">{localSummary.schools}</p>
                                </div>
                                <div className="pt-4 border-t">
                                     <h4 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                                        <AlertCircle className="w-5 h-5 text-primary"/>
                                        Transport
                                    </h4>
                                    <p className="text-sm text-foreground">{localSummary.transport}</p>
                                </div>
                                <div className="pt-4 border-t">
                                     <h4 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                                        <Trees className="w-5 h-5 text-primary"/>
                                        Character of the Area
                                    </h4>
                                    <p className="text-sm text-foreground">{localSummary.character}</p>
                                </div>
                            </div>
                        ) : (
                             <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground text-center">Enter a postcode and select an area to generate a local area summary.</p>
                             </div>
                        )}
              </CardContent>
            </TabsContent>

            <TabsContent value="property-checker">
              <CardContent className="p-0" style={{ height: '80vh' }}>
                {postcode ? (
                  <iframe
                    src={`https://propertychecker.co.uk/results/?postcode=${postcode}`}
                    title="Property Checker"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                ) : (
                  <div className="p-8 min-h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground text-center">
                      Enter a postcode in the "Property Details" tab to use the Property
                      Checker.
                    </p>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="epc">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter postcode..."
                    value={epcPostcode}
                    onChange={(e) => setEpcPostcode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEpcLookup()}
                    className="max-w-xs"
                  />
                  <Button onClick={handleEpcLookup} disabled={isEpcLoading}>
                    {isEpcLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>

                {epcError && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{epcError}</AlertDescription>
                  </Alert>
                )}

                {selectedEpc ? (
                  <Card>
                    <CardHeader>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedEpc(null)}
                        className="mb-2 w-fit p-0 h-auto text-primary hover:text-primary/80"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to results
                      </Button>
                      <CardTitle>{selectedEpc.address}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Property Details</h4>
                        <ul className="space-y-2 text-sm border-t pt-4">
                          <li className="flex justify-between">
                            <span>Property Type:</span>{' '}
                            <span className="font-medium text-right">
                              {selectedEpc['property-type']}
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span>Total Floor Area:</span>{' '}
                            <span className="font-medium">
                              {selectedEpc['total-floor-area']} m²
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span>Build Date:</span>{' '}
                            <span className="font-medium">
                              {selectedEpc['construction-age-band']}
                            </span>
                          </li>
                        </ul>
                      </div>
                      <div className="max-w-sm mx-auto">
                        <EpcStandardGraph
                          currentValue={safeParseInt(selectedEpc['current-energy-efficiency'])}
                          potentialValue={safeParseInt(
                            selectedEpc['potential-energy-efficiency'],
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : epcResults.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Properties found with an EPC{' '}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {epcResults.map((cert: any) => (
                        <button
                          key={cert['lmk-key']}
                          onClick={() => handleSelectEpc(cert)}
                          className="text-left"
                        >
                          <EpcCardComponent record={cert} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </TabsContent>

            <TabsContent value="valuation">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter property address..."
                    value={valuationAddress}
                    onChange={(e) => setValuationAddress(e.target.value)}
                    className="max-w-md"
                  />
                  <Button onClick={handleGenerateValuation} disabled={isValuationLoading}>
                    {isValuationLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Generate
                  </Button>
                </div>

                {isValuationLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </div>
                ) : valuationError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{valuationError}</AlertDescription>
                  </Alert>
                ) : valuationReport ? (
                  <div className="pt-6" id="valuation-report-content">
                    <Accordion
                      type="multiple"
                      defaultValue={
                        valuationReport.match(/###\s(🔶|🔽).*$/gm)?.map((h) => h.trim()) || []
                      }
                      className="w-full"
                    >
                      <ReactMarkdown
                        components={{
                          h3: ({ node, ...props }) => {
                            const titleWithIcon = String(props.children);
                            const cleanTitle = titleWithIcon
                              .replace(/^(###\s*)|(🔶\s*)|(🔽\s*)/, '')
                              .trim();

                            if (!cleanTitle) return null;

                            return (
                              <AccordionItem value={titleWithIcon.trim()} className="border-b">
                                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                                  {cleanTitle}
                                </AccordionTrigger>
                                <AccordionContent className="prose prose-sm max-w-none pt-2">
                                  {props.children}
                                </AccordionContent>
                              </AccordionItem>
                            );
                          },
                          hr: () => null,
                        }}
                      >
                        {valuationReport.replace(/(?=###\s(🔶|🔽))/g, '\n---\n')}
                      </ReactMarkdown>
                    </Accordion>

                    <div className="mt-8 text-center" id="print-button-container">
                      <Button onClick={handlePrintValuation}>Generate PDF Report</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[200px]">
                    <p className="text-muted-foreground">
                      Enter a property address and click &quot;Generate&quot; to create a
                      valuation report.
                    </p>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="saved-properties">
              <CardHeader>
                <CardTitle>Saved Properties</CardTitle>
                <CardDescription>
                  Review and load your previously saved analysis projects.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by property address..."
                    className="pl-10"
                    value={projectsSearchQuery}
                    onChange={(e) => setProjectsSearchQuery(e.target.value)}
                  />
                </div>

                {isProjectsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredProjects.length > 0 ? (
                  <div className="space-y-4">
                    {filteredProjects.map((project) => (
                      <Card key={project.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{project.projectName}</p>
                            <p className="text-sm text-muted-foreground">
                              Saved on{' '}
                              {project.createdAt?.toDate
                                ? formatDate(project.createdAt.toDate())
                                : 'Unknown'}
                            </p>
                          </div>
                          <Button onClick={() => loadProject(project)}>Load Project</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No saved properties found.</p>
                  </div>
                )}
              </CardContent>
            </TabsContent>
          </Card>
        </Tabs>

        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Image</DialogTitle>
            </DialogHeader>
            <div className="h-[50vh]">
              {editingFile && (
                <Cropper
                  ref={cropperRef}
                  src={editingFile.file.preview}
                  style={{ height: '100%', width: '100%' }}
                  viewMode={1}
                  dragMode="move"
                  background={false}
                  responsive
                  autoCropArea={1}
                  checkOrientation={false}
                  guides
                />
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onRotate(-90)}>
                Rotate Left
              </Button>
              <Button variant="outline" onClick={() => onRotate(90)}>
                Rotate Right
              </Button>
              <Button variant="secondary" onClick={closeEditor}>
                Cancel
              </Button>
              <Button onClick={onCrop}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogExitTitle>Are you sure?</AlertDialogExitTitle>
              <AlertDialogExitDescription>
                Any unsaved changes will be lost. Are you sure you want to return to the dashboard?
              </AlertDialogExitDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogExitTitle>Are you sure?</AlertDialogExitTitle>
              <AlertDialogExitDescription>
                This will clear all inputs and generated content. This action cannot be undone.
              </AlertDialogExitDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRestart}>Confirm Restart</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <footer className="text-center py-8 text-sm text-muted-foreground">
          Powered by estate-agent.studio AI
        </footer>
      </div>
    </AppLayout>
  );
}