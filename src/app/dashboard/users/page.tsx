
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Shield, ShieldCheck, ArrowLeft } from 'lucide-react';
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
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { format } from 'date-fns';

interface UserData {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: any;
}

export default function UserManagementPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { firestore: db } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!userProfile || userProfile.role !== 'admin') {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this page.',
        });
        router.push('/dashboard');
      }
    }
  }, [userProfile, authLoading, router, toast]);

  useEffect(() => {
    if (userProfile?.role !== 'admin' || !db) return;

    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(usersQuery, 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        } as UserData));
        setUsers(usersData);
        setIsLoading(false);
      },
      (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'users',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        
        toast({
          variant: 'destructive',
          title: 'Failed to load users',
          description: 'You do not have permission to view this list.',
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile, toast, db]);

  const handleRoleChange = (uid: string, newRole: 'admin' | 'user') => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    const roleUpdate = { role: newRole };
    updateDoc(userRef, roleUpdate)
      .then(() => {
        toast({
          title: 'Role Updated',
          description: `User has been successfully ${newRole === 'admin' ? 'promoted to Admin' : 'demoted to User'}.`,
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: roleUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
        // The listener will throw the error, no need to toast here
      });
  };

  const confirmDeleteUser = (user: UserData) => {
    setUserToDelete(user);
  };

  const handleDeleteUser = () => {
    if (!userToDelete || !db) return;

    const userRef = doc(db, 'users', userToDelete.uid);
    deleteDoc(userRef)
      .then(() => {
        toast({
          title: 'User Deleted',
          description: `${userToDelete.email} has been permanently removed.`,
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        // The listener will throw the error, no need to toast here
      })
      .finally(() => {
        setUserToDelete(null);
      });
  };
  
  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">User Management</h1>
        </div>
        <p className="text-muted-foreground mb-8">View, manage roles for, and delete users in the system.</p>

        <Card className="bg-white/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>A real-time list of all users registered in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.createdAt?.toDate ? format(user.createdAt.toDate(), 'PPP') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {user.uid !== userProfile?.uid && (
                          <>
                            {user.role === 'user' ? (
                              <Button
                                size="sm"
                                className="bg-emerald-500 text-white hover:bg-emerald-600"
                                onClick={() => handleRoleChange(user.uid, 'admin')}
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Promote to Admin
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRoleChange(user.uid, 'user')}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Demote to User
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => confirmDeleteUser(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <span className="font-bold">{userToDelete?.email}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteUser}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
