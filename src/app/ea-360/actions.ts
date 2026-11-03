'use server';

export async function uploadAndProcessFiles(formData: FormData) {
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return { success: false, message: 'No files were uploaded.' };
  }

  console.log(`Received ${files.length} files.`);

  for (const file of files) {
    console.log(`- ${file.name} (${file.size} bytes)`);
    // In a real application, you would process each file here.
    // For example, upload it to cloud storage.
    // Since we cannot process ZIP files server-side here, we will just log it.
  }

  // Simulating a successful upload and process.
  const processingResult = {
    success: true,
    message: `Successfully received ${files.length} files. In a real app, they would now be processed.`,
    fileNames: files.map(f => f.name),
  };
  
  console.log(processingResult);

  return processingResult;
}
