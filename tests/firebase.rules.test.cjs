const {before,after,test}=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,collection,getDoc,getDocs,setDoc,updateDoc,query,where}=require('firebase/firestore');
let env;
before(async()=>{
  env=await initializeTestEnvironment({
    projectId:'demo-estateagent-studio',
    firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')},
    storage:{rules:fs.readFileSync(path.join(__dirname,'../storage.rules'),'utf8')}
  });
  await env.withSecurityRulesDisabled(async c=>{
    const db=c.firestore();
    for(const uid of ['alice','bob'])
      await setDoc(doc(db,'users',uid),{id:uid,role:'user',permissions:[],name:uid});
    await setDoc(doc(db,'projects/p1'),{userId:'alice',projectName:'Alice property'});
    await setDoc(doc(db,'projects/p2'),{userId:'bob',projectName:'Bob property'});
    await setDoc(doc(db,'tenants/t1/members/alice'),{role:'staff'});
    await setDoc(doc(db,'tenants/t2/members/bob'),{role:'staff'});
    await setDoc(doc(db,'tenants/t1/projects/a'),{tenantId:'t1',userId:'alice'});
    await setDoc(doc(db,'tenants/t2/projects/b'),{tenantId:'t2',userId:'bob'});
  });
});
after(async()=>{if(env)await env.cleanup();});
test('anonymous cannot view profiles or projects',async()=>{
  const db=env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db,'users/alice')));
  await assertFails(getDoc(doc(db,'projects/p1')));
});
test('self service profile cannot grant privileges',async()=>{
  const db=env.authenticatedContext('alice').firestore();
  await assertFails(updateDoc(doc(db,'users/alice'),{role:'superadmin'}));
  await assertFails(updateDoc(doc(db,'users/alice'),{permissions:['admin']}));
  await assertSucceeds(updateDoc(doc(db,'users/alice'),{name:'Alice Renamed'}));
  await assertFails(getDocs(collection(db,'users')));
});
test('new profile must be an unprivileged account',async()=>{
  const db=env.authenticatedContext('new').firestore();
  await assertFails(setDoc(doc(db,'users/new'),{role:'admin',permissions:[]}));
  await assertSucceeds(setDoc(doc(db,'users/new'),{id:'new',role:'user',permissions:[],name:'New'}));
});
test('legacy projects are owner only, queries must filter userId',async()=>{
  const db=env.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(db,'projects/p1')));
  await assertFails(getDoc(doc(db,'projects/p2')));
  await assertFails(getDocs(collection(db,'projects')));
  await assertSucceeds(getDocs(query(collection(db,'projects'),where('userId','==','alice'))));
  await assertFails(setDoc(doc(db,'projects/p3'),{userId:'bob'}));
});
test('members cannot read or create projects in foreign tenants',async()=>{
  const db=env.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(db,'tenants/t1/projects/a')));
  await assertFails(getDoc(doc(db,'tenants/t2/projects/b')));
  await assertFails(setDoc(doc(db,'tenants/t2/projects/fake'),{tenantId:'t2',userId:'alice'}));
});
test('profile data alone cannot grant platform admin access',async()=>{
  const db=env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db,'companies/forged'),{name:'Forged'}));
  const admin=env.authenticatedContext('root',{admin:true}).firestore();
  await assertSucceeds(getDocs(collection(admin,'users')));
});
