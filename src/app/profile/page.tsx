'use client';

import React, { useState, useEffect } from 'react';
import { useAuth as useAppAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, useFirebase } from '@/firebase';

export default function ProfilePage() {
  const { user, userProfile, profileLoading, loading: authLoading, effectiveRole } = useAppAuth();
  const { firestore: db } = useFirebase();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [telephone, setTelephone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setCompany(userProfile.company || '');
      setTelephone(userProfile.telephone || '');
    }
  }, [userProfile]);

  const handleProfileUpdate = async () => {
    if (!user || !userProfile || !db) return;
    setIsSaving(true);

    const userDocRef = doc(db, 'users', user.uid);

    const updatedData = {
      id: userProfile.uid,
      name,
      company,
      telephone,
    };

    try {
        if (user.displayName !== name) {
            await updateProfile(user, { displayName: name });
        }

        await updateDoc(userDocRef, updatedData);

        toast({ title: 'Profile Updated', description: 'Your information has been saved.' });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'update',
              requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
           toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected error occurred.'
          });
        }
    } finally {
        setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    if (!currentPassword) {
        toast({ variant: 'destructive', title: 'Current Password Required', description: 'Please enter your current password to set a new one.' });
        return;
    }

    setIsSaving(true);
    try {
        if (user.email) {
             const credential = EmailAuthProvider.credential(user.email, currentPassword);
             await reauthenticateWithCredential(user, credential);
        }
      await updatePassword(user, newPassword);
      toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Password Change Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading || authLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!user || !userProfile) {
    return (
      <AppLayout>
        <p>Please log in to view your profile.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline mb-8">Your Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="items-center text-center">
                 <div className="relative">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={userProfile.avatar || user.photoURL || undefined} alt={userProfile.name || ''} />
                        <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                 </div>
              </CardHeader>
              <CardContent className="text-center">
                <CardTitle>{userProfile.name}</CardTitle>
                <CardDescription>{userProfile.email}</CardDescription>
                 <CardDescription className="capitalize mt-1 font-semibold text-primary">{effectiveRole}</CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal and company details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="telephone">Telephone</Label>
                    <Input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleProfileUpdate} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Set a new password for your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                     <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handlePasswordChange} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}