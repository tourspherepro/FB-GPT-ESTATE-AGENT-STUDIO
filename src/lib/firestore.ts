
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, addDoc, getDocs, serverTimestamp, QueryDocumentSnapshot, DocumentData, orderBy, query, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const { firestore: db } = initializeFirebase();

export interface Post {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt?: any;
}

// Add a new post to Firestore
export const addPost = (post: Post) => {
  const postsCollection = collection(db, 'posts');
  addDoc(postsCollection, {
    ...post,
    createdAt: serverTimestamp(),
  }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: postsCollection.path,
      operation: 'create',
      requestResourceData: post,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
};

// Get all posts from Firestore
export const getPosts = async (): Promise<Post[]> => {
  const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  try {
      const querySnapshot = await getDocs(postsQuery);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          createdAt: data.createdAt,
        } as Post;
      });
  } catch (serverError) {
      const permissionError = new FirestorePermissionError({
          path: 'posts',
          operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      return []; // Return an empty array on error to fulfill the promise signature
  }
};

export const deleteUserRequest = (requestId: string) => {
    const requestRef = doc(db, 'userRequests', requestId);
    deleteDoc(requestRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: requestRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}
