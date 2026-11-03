

'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, Pencil, X, Loader2, Copy, Info, Home, CheckCircle2, AlertCircle, ShoppingCart, Trees, Dumbbell, Search, ShieldCheck, XCircle, RotateCcw } from 'lucide-react';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { analyzeValuationData, LocalSummary } from '@/ai/flows/analyze-valuation-data';
import { analyzeFloorPlan, MeasurementData } from '@/ai/flows/analyze-floor-plan';
import { clientPostcodeLookup } from '@/ai/flows/client-postcode-lookup';
import { epcSearch, type EpcSearchResult, fetchCertificateDetailsClient, type EpcCertificate } from '@/ai/flows/epc-lookup';
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { safeParseInt, getRatingColor, getRatingTextColor } from '@/lib/epcUtils';
import EpcStandardGraph from '@/components/epc-standard-graph';
import { lookupConservationArea, type ConservationAreaResult } from '@/ai/flows/conservation-area-lookup';
import ReactMarkdown from 'react-markdown';
import { Progress } from '@/components/ui/progress';


type FileWithPreview = File & { preview: string };

type PostcodeData = {
    parish?: string;
    admin_ward?: string;
    admin_district?: string;
    parliamentary_constituency?: string;
    region?: string;
};

type GenerationStatus = {
    advert: 'pending' | 'success' | 'error' | 'skipped';
    localSummary: 'pending' | 'success' | 'error' | 'skipped';
    measurements: 'pending' | 'success' | 'error' | 'skipped';
    epc: 'pending' | 'success' | 'error' | 'skipped';
    conservation: 'pending' | 'success' | 'error' | 'skipped';
};

const propertyTypes = [
    "Detached",
    "Semi-detached",
    "Mid-Terrace",
    "End-Terrace",
    "Detached Bungalow",
    "Semi-detached bungalow",
    "Mid Terraced Bungalow",
    "End Terraced Bungalow",
    "Flats / Apartment",
    "Town House"
];


export default function EaValuationPage() {
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [purchaseStyle, setPurchaseStyle] = useState<string>('Family Home');
  const [reportType, setReportType] = useState<string>('Include Street Name Detail');
  const [councilTaxBand, setCouncilTaxBand] = useState<string | undefined>(undefined);
  const [propertyPhotos, setPropertyPhotos] = useState<FileWithPreview[]>([]);
  const [floorplan, setFloorplan] = useState<FileWithPreview | null>(null);
  const [activeTab, setActiveTab] = useState('property-details');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  const [postcodeData, setPostcodeData] = useState<PostcodeData | null>(null);
  const [postcodeOptions, setPostcodeOptions] = useState<{ value: string, label: string, key: string }[]>([]);
  const [isPostcodeLoading, setIsPostcodeLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');


  const [adHighlights, setAdHighlights] = useState('');
  const [adDescription, setAdDescription] = useState('');

  const [localSummary, setLocalSummary] = useState<LocalSummary | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  
  const [adError, setAdError] = useState<string | null>(null);
  const [localSummaryError, setLocalSummaryError] = useState<string | null>(null);
  const [measurementsError, setMeasurementsError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<{file: FileWithPreview, type: 'photo' | 'floorplan', index?: number} | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const [epcPostcode, setEpcPostcode] = useState('');
  const [isEpcLoading, setIsEpcLoading] = useState(false);
  const [epcResults, setEpcResults] = useState<any[]>([]);
  const [epcError, setEpcError] = useState<string | null>(null);
  const [selectedEpc, setSelectedEpc] = useState<any | null>(null);
  const [isEpcDetailsLoading, setIsEpcDetailsLoading] = useState(false);

  const [conservationResult, setConservationResult] = useState<ConservationAreaResult | null>(null);
  const [isConservationLoading, setIsConservationLoading] = useState(false);
  const [conservationError, setConservationError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const handler = setTimeout(() => {
      if (postcode.length > 5) { // Basic validation
        setIsPostcodeLoading(true);
        setPostcodeData(null);
        setSelectedArea('');
        clientPostcodeLookup(postcode)
          .then(data => {
            if (data && Object.keys(data).length > 0) {
              setPostcodeData(data);
              const order: (keyof PostcodeData)[] = ['parish', 'admin_ward', 'admin_district', 'parliamentary_constituency', 'region'];
              const options = order.map(key => {
                const value = data[key];
                return value ? { value, label: `${value} (${key.replace(/_/g, ' ')})`, key } : null;
              }).filter((opt): opt is { value: string, label: string, key: string } => opt !== null);

              setPostcodeOptions(options);

              // Auto-select admin_ward if available
              const defaultSelection = options.find(opt => opt.key === 'admin_ward');
              if (defaultSelection) {
                setSelectedArea(defaultSelection.value);
              } else if (options.length > 0) {
                setSelectedArea(options[0].value)
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
      }
    }, 500); // Debounce API calls

    return () => {
      clearTimeout(handler);
    };
  }, [postcode, toast]);


 useEffect(() => {
    if (isLoading || !generationStatus) return;

    if (generationStatus.advert === 'success') {
      setActiveTab('valuation');
    } else if (generationStatus.measurements === 'success') {
      setActiveTab('measurements');
    } else if (generationStatus.localSummary === 'success') {
      setActiveTab('local-area-info');
    }
  }, [generationStatus, isLoading]);



  const onDrop = useCallback((acceptedFiles: File[], type: 'photos' | 'floorplan') => {
    const filesWithPreview = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));

    if (type === 'photos') {
      setPropertyPhotos(prev => [...prev, ...filesWithPreview]);
    } else {
      setFloorplan(filesWithPreview[0]);
    }
  }, []);

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
      setPropertyPhotos(prev => prev.filter((_, i) => i !== index));
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
  }

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
  });

  const handleRestart = () => {
    setShowRestartDialog(false);
    setPostcode('');
    setPropertyType('');
    setPurchaseStyle('Family Home');
    setCouncilTaxBand(undefined);
    setPropertyPhotos([]);
    setFloorplan(null);
    setActiveTab('property-details');
    setAdHighlights('');
    setAdDescription('');
    setLocalSummary(null);
    setMeasurements([]);
    setGenerationStatus(null);
    setPostcodeData(null);
    setPostcodeOptions([]);
    setSelectedArea('');
    setEpcPostcode('');
    setEpcResults([]);
    setSelectedEpc(null);
    setConservationResult(null);
  }

  const handleGenerate = async () => {
    if (propertyPhotos.length === 0 && !floorplan && (!postcode || !selectedArea)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please upload photos, a floorplan, or enter a postcode and select an area.' });
        return;
    }
    
    const runAd = reportType !== 'Only Produce Measurements';
    const runLocalSummary = reportType === 'Include Street Name Detail';
    const runMeasurements = reportType !== 'Only Produce Advert Preview';

    const hasPhotos = propertyPhotos.length > 0;
    const hasFloorplan = !!floorplan;
    const hasPostcodeAndArea = !!postcode && !!selectedArea;
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
    });

    setAdError(null);
    setLocalSummaryError(null);
    setMeasurementsError(null);
    setEpcError(null);
    setConservationError(null);
    setAdHighlights('');
    setAdDescription('');
    setLocalSummary(null);
    setMeasurements([]);
    setEpcResults([]);
    setSelectedEpc(null);
    setConservationResult(null);
    
    const canRunAd = runAd && hasPhotos;
    const canRunLocalSummary = runLocalSummary && hasPostcodeAndArea;
    const canRunMeasurements = runMeasurements && hasFloorplan;
    const canRunEpc = hasPostcode;
    const canRunConservation = hasPostcode;

    const tasks: (() => Promise<void>)[] = [];
    
    // --- Task Definitions ---
    
    async function runLocalSummaryTask() {
        setProgressMessage('Generating local summary...');
        setGenerationStatus(s => s ? { ...s, localSummary: 'pending' } : s);
        try {
             const result = await analyzeValuationData({
                runLocalSummary: true,
                runAd: false,
                areaNameToSummarise: selectedArea,
                postcode: postcode,
                includeStreetNameDetail: reportType === 'Include Street Name Detail',
                photoDataUris: [],
            });

            if (result.localSummary) {
                setLocalSummary(result.localSummary);
                setGenerationStatus(s => s ? { ...s, localSummary: 'success' } : s);
            } else {
                setLocalSummaryError('Could not generate local summary.');
                setGenerationStatus(s => s ? { ...s, localSummary: 'error' } : s);
            }
        } catch (e) {
            console.error(e)
            setLocalSummaryError('An error occurred during local summary generation.');
            setGenerationStatus(s => s ? { ...s, localSummary: 'error' } : s);
        }
    }

    async function runAdTask() {
        setProgressMessage('Generating valuation summary...');
        setGenerationStatus(s => s ? { ...s, advert: 'pending' } : s);
        try {
            const photoDataUris = await Promise.all(propertyPhotos.map(p => toBase64(p)));
            
            const result = await analyzeValuationData({
                runAd: true,
                photoDataUris,
                propertyType: propertyType,
                purchaseStyles: [purchaseStyle],
                councilTaxBand: councilTaxBand,
            });

            if (result.propertyAdvert) {
                const [highlights, description] = result.propertyAdvert.split('===DESCRIPTION===');
                setAdHighlights(highlights.trim());
                setAdDescription(description ? description.trim() : '');
                setGenerationStatus(s => s ? { ...s, advert: 'success' } : s);
            } else {
                setAdError('Could not generate property advert.');
                setGenerationStatus(s => s ? { ...s, advert: 'error' } : s);
            }
        } catch (e) {
            console.error(e);
            setAdError('An error occurred during ad generation.');
            setGenerationStatus(s => s ? { ...s, advert: 'error' } : s);
        }
    }

    async function runMeasurementsTask() {
        setProgressMessage('Analyzing floorplan...');
        setGenerationStatus(s => s ? { ...s, measurements: 'pending' } : s);
        try {
            if (floorplan) {
                const base64 = await toBase64(floorplan);
                const result = await analyzeFloorPlan({ floorplanDataUri: base64 });
                if (result.measurements && result.measurements.length > 0) {
                    setMeasurements(result.measurements || []);
                    setGenerationStatus(s => s ? { ...s, measurements: 'success' } : s);
                } else {
                    setMeasurementsError('Could not extract measurements from the floorplan.');
                    setGenerationStatus(s => s ? { ...s, measurements: 'error' } : s);
                }
            }
        } catch (e) {
            setMeasurementsError('Failed to analyze floorplan.');
            setGenerationStatus(s => s ? { ...s, measurements: 'error' } : s);
        }
    }

    async function runEpcTask() {
        setProgressMessage('Looking up EPC records...');
        setGenerationStatus(s => s ? { ...s, epc: 'pending' } : s);
        try {
            const results = await epcSearch({ postcode: postcode });
            if (results.certificates.length === 0) {
                setEpcError('No EPC records found for this postcode.');
                setGenerationStatus(s => s ? { ...s, epc: 'error' } : s);
            } else {
                const detailedCerts = await Promise.all(
                    results.certificates.map(cert => fetchCertificateDetailsClient(cert.lmkKey))
                );
                // Filter for unique addresses, keeping only the latest one
                const uniqueCerts = Object.values(
                    detailedCerts.filter(Boolean).reduce((acc: any, cert: any) => {
                        const address = cert.address.toLowerCase();
                        if (!acc[address] || new Date(cert['assessment-date']) > new Date(acc[address]['assessment-date'])) {
                            acc[address] = cert;
                        }
                        return acc;
                    }, {})
                );
                setEpcResults(uniqueCerts);
                setEpcPostcode(postcode); // Set the postcode for the EPC tab
                setGenerationStatus(s => s ? { ...s, epc: 'success' } : s);
            }
        } catch (e: any) {
            console.error(e);
            setEpcError(e.message || 'An unexpected error occurred during EPC lookup.');
            setGenerationStatus(s => s ? { ...s, epc: 'error' } : s);
        }
    }

    async function runConservationTask() {
        setProgressMessage('Checking conservation area status...');
        setGenerationStatus(s => s ? { ...s, conservation: 'pending' } : s);
        try {
          const result = await lookupConservationArea(postcode);
          setConservationResult(result);
          setGenerationStatus(s => s ? { ...s, conservation: 'success' } : s);
        } catch (error: any) {
          console.error(error);
          setConservationError(error.message || 'An unexpected error occurred.');
          setGenerationStatus(s => s ? { ...s, conservation: 'error' } : s);
        }
    }


    // Add tasks in the desired order of execution
    if (canRunLocalSummary) tasks.push(runLocalSummaryTask);
    if (canRunAd) tasks.push(runAdTask);
    if (canRunMeasurements) tasks.push(runMeasurementsTask);
    if (canRunEpc) tasks.push(runEpcTask);
    if (canRunConservation) tasks.push(runConservationTask);
    
    let completedTasks = 0;
    const totalTasks = tasks.length;
   
    // --- Sequential Execution ---
    for (const task of tasks) {
        await task();
        completedTasks++;
        setProgress((completedTasks / totalTasks) * 100);
    }
    
    setProgressMessage('All tasks completed!');
    setIsLoading(false);
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
             const detailedCerts = await Promise.all(
                results.certificates.map(cert => fetchCertificateDetailsClient(cert.lmkKey))
            );
            // Filter for unique addresses, keeping only the latest one
            const uniqueCerts = Object.values(
                detailedCerts.filter(Boolean).reduce((acc: any, cert: any) => {
                    const address = cert.address.toLowerCase();
                    if (!acc[address] || new Date(cert['assessment-date']) > new Date(acc[address]['assessment-date'])) {
                        acc[address] = cert;
                    }
                    return acc;
                }, {})
            );
            setEpcResults(uniqueCerts);
        }
    } catch (error: any) {
        setEpcError(error.message || 'An unexpected error occurred.');
    } finally {
        setIsEpcLoading(false);
    }
  };

  const handleSelectEpc = async (certificate: any) => {
    setSelectedEpc(certificate);
    if(certificate['council-tax-band']) {
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
    } catch (error: any)
    {
      setConservationError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsConservationLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to Clipboard', description: `The ${type} has been copied.` });
  };

  const isGenerateDisabled = (() => {
    if (isLoading) return true;
    
    if (reportType === 'Only Produce Advert Preview') {
        return propertyPhotos.length === 0;
    } 
    if (reportType === 'Only Produce Measurements') {
        return !floorplan;
    }
    
    return propertyPhotos.length === 0 && !floorplan && (!postcode || !selectedArea);
  })();

  
  const ImageThumb = ({ file, onRemove, onEdit }: { file: FileWithPreview, onRemove: () => void, onEdit: () => void }) => (
    <div className="relative group aspect-video">
      <Image src={file.preview} alt={file.name} fill className={cn("rounded-lg", 'object-contain')} />
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}
      {!isLoading && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-lg">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onEdit}><Pencil className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onRemove}><X className="w-5 h-5" /></Button>
        </div>
      )}
    </div>
  );
  
  const RatingBadge: React.FC<{rating: string, score: number}> = ({ rating, score }) => {
    const ratingColor = getRatingColor(rating);
    const textColor = getRatingTextColor(rating);
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${ratingColor} ${textColor}`}>
            {rating.toUpperCase()} ({score})
        </span>
    );
  };


  const EpcCardComponent: React.FC<{record: any}> = ({ record }) => {
    if (!record) return null;
    const expiryDate = getExpiryDate(record['lodgement-date']);
    
    return (
      <Card className="flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
            <CardTitle className="text-base truncate" title={record.address}>{record.address}</CardTitle>
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


  const annualCostCurrent = selectedEpc ? 
    safeParseInt(selectedEpc['lighting-cost-current']) + 
    safeParseInt(selectedEpc['heating-cost-current']) + 
    safeParseInt(selectedEpc['hot-water-cost-current']) : 0;
    
  const annualCostPotential = selectedEpc ?
    safeParseInt(selectedEpc['lighting-cost-potential']) +
    safeParseInt(selectedEpc['heating-cost-potential']) +
    safeParseInt(selectedEpc['hot-water-cost-current']) : 0;

  const getExpiryDate = (lodgementDate: string) => {
    if (!lodgementDate) return null;
    const date = new Date(lodgementDate);
    date.setFullYear(date.getFullYear() + 10);
    return date;
  };

  const calculatedExpiryDate = selectedEpc ? getExpiryDate(selectedEpc['lodgement-date']) : null;
  const isEpcExpired = calculatedExpiryDate ? calculatedExpiryDate < new Date() : false;


  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
  };

  const mainDescription = adDescription;


  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto relative">
        {isLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="w-full max-w-md p-8 text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                    <h2 className="text-lg font-semibold text-foreground mb-2">Generating Content...</h2>
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-2">{progressMessage || `${Math.round(progress)}% complete`}</p>
                </div>
            </div>
        )}
        <div className="flex items-center gap-4 mb-2">
          
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">EA Valuation</h1>
        </div>
        <p className="text-muted-foreground mb-8">Generate compelling property marketing copy from photos, floorplans, and more.</p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent border-b rounded-none p-0 mb-6 justify-start">
                <TabsTrigger value="property-details" className="pb-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary disabled:text-muted-foreground/50">Property Details</TabsTrigger>
                <TabsTrigger value="measurements" className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary disabled:text-muted-foreground/50 flex items-center gap-2" disabled={generationStatus?.measurements !== 'success'}>
                  Measurements
                  {generationStatus?.measurements === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="rooms" className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary disabled:text-muted-foreground/50 flex items-center gap-2" disabled={generationStatus?.measurements !== 'success'}>
                  Rooms
                  {generationStatus?.measurements === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="local-area-info" className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary disabled:text-muted-foreground/50 flex items-center gap-2" disabled={generationStatus?.localSummary !== 'success'}>
                  Local Area Info
                  {generationStatus?.localSummary === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="property-checker" className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary disabled:text-muted-foreground/50 flex items-center gap-2" disabled={!generationStatus}>
                  Property Checker
                  {generationStatus && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="epc" className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">EPC</TabsTrigger>
                <TabsTrigger value="valuation" className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary disabled:text-muted-foreground/50 flex items-center gap-2" disabled={generationStatus?.advert !== 'success'}>
                  Valuation
                  {generationStatus?.advert === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="land-registry" className="ml-4 pb-2 rounded-none bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Land Registry</TabsTrigger>
            </TabsList>
            
            <Card className="rounded-2xl shadow-sm">
                <TabsContent value="property-details">
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                               <div className="lg:col-span-3 space-y-2">
                                    <Label htmlFor="postcode">Postcode</Label>
                                    <div className="relative">
                                        <Input id="postcode" placeholder="e.g., SW1A 0AA" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
                                        {isPostcodeLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                                    </div>
                                    {postcodeOptions.length > 0 && (
                                        <div className="pt-2">
                                            <Label htmlFor="area-select">Area to Summarise</Label>
                                            <Select value={selectedArea} onValueChange={setSelectedArea}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an area..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {postcodeOptions.map((opt) => (
                                                      <SelectItem key={opt.key} value={opt.value}>
                                                        {opt.label}
                                                      </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedArea && <p className="text-xs text-muted-foreground mt-1">Using: <span className="font-semibold text-foreground">{selectedArea}</span></p>}
                                        </div>
                                    )}
                                </div>
                                <div className="lg:col-span-3 space-y-2">
                                    <Label>Property Type</Label>
                                    <Select onValueChange={setPropertyType} value={propertyType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select property type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {propertyTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="lg:col-span-3 space-y-3">
                                  <h4 className="font-medium text-sm text-foreground">Style of Purchase</h4>
                                  <RadioGroup value={purchaseStyle} onValueChange={setPurchaseStyle} className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="Family Home" id="family-home" />
                                          <Label htmlFor="family-home" className="font-normal">Family Home</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="First Time Buyer" id="ftb" />
                                          <Label htmlFor="ftb" className="font-normal">First Time Buyer</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="Investment" id="investment" />
                                          <Label htmlFor="investment" className="font-normal">Investment</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="Standard Auction" id="standard-auction" />
                                          <Label htmlFor="standard-auction" className="font-normal">Standard Auction</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="Modern Method of Auction" id="modern-auction" />
                                          <Label htmlFor="modern-auction" className="font-normal">Modern Method of Auction</Label>
                                      </div>
                                  </RadioGroup>
                                </div>

                                <div className="lg:col-span-3 space-y-3">
                                  <h4 className="font-medium text-sm text-foreground">Report Type</h4>
                                  <RadioGroup value={reportType} onValueChange={setReportType} className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Include Street Name Detail" id="include-street-detail" />
                                        <Label htmlFor="include-street-detail" className="font-normal">Include Street Name Detail</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Only Produce Advert Preview" id="only-advert" />
                                        <Label htmlFor="only-advert" className="font-normal">Only Produce Advert Preview</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Only Produce Measurements" id="only-measurements" />
                                        <Label htmlFor="only-measurements" className="font-normal">Only Produce Measurements</Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                                <div className="lg:col-span-6 space-y-2">
                                    <Label htmlFor="portal-link">Portal Link</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="portal-link" placeholder="Search portal link..." className="pl-8" />
                                    </div>
                                </div>
                                <div className="lg:col-span-6 flex items-center gap-2">
                                    <Button size="lg" onClick={handleGenerate} disabled={isGenerateDisabled}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isLoading ? 'Generating...' : 'Generate Content'}
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => setShowRestartDialog(true)}>
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Restart Advert
                                    </Button>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <Label>Property Photos</Label>
                            <div {...getPhotosRootProps()} className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary">
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
                                    <ImageThumb key={`${file.name}-${i}`} file={file} onRemove={() => removeFile('photo', i)} onEdit={() => openEditor(file, 'photo', i)}/>
                                ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <Label>Floorplan (Optional)</Label>
                            {floorplan ? (
                                <div className="mt-2">
                                  <ImageThumb file={floorplan} onRemove={() => removeFile('floorplan')} onEdit={() => openEditor(floorplan, 'floorplan')} />
                                </div>
                            ) : (
                                <div {...getFloorplanRootProps()} className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary">
                                    <input {...getFloorplanInputProps()} />
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Drag &amp; drop floorplan here, or click to select file</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </TabsContent>

                <TabsContent value="measurements">
                    <CardContent className="p-8 min-h-[400px]">
                        {generationStatus?.measurements === 'pending' ? (
                             <div className="flex items-center justify-center h-full">
                                <div className="text-center text-muted-foreground">
                                    <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                                    <p className="mt-4">Analyzing floorplan...</p>
                                </div>
                            </div>
                        ) : measurementsError ? (
                            <div className="flex items-center justify-center h-full">
                                <Alert variant="destructive" className="max-w-md">
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{measurementsError}</AlertDescription>
                                </Alert>
                            </div>
                        ) : measurements.length > 0 ? (
                            <div className="space-y-6">
                                {measurements.map((floor, floorIndex) => (
                                    <div key={floorIndex}>
                                        <h3 className="text-lg font-semibold text-foreground mb-3 border-b pb-2">{floor.floorName}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {floor.rooms.map((room, roomIndex) => (
                                                <div key={`${floorIndex}-${roomIndex}`} className="bg-card p-4 rounded-lg shadow-sm flex items-center justify-between border">
                                                    <div className="flex items-center gap-3">
                                                        <Home className="w-5 h-5 text-primary" />
                                                        <span className="font-medium">{room.roomName}</span>
                                                    </div>
                                                    <Badge variant="secondary" className="font-mono text-sm">{room.dimensions}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground text-center">Upload a floorplan in the "Property Details" tab to generate measurements.</p>
                             </div>
                        )}
                    </CardContent>
                </TabsContent>

                <TabsContent value="rooms">
                    <CardContent className="p-8 min-h-[400px]">
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground text-center">Room content will be displayed here.</p>
                        </div>
                    </CardContent>
                </TabsContent>

                <TabsContent value="valuation">
                    <CardContent className="p-8 min-h-[400px] flex items-center justify-center">
                        {generationStatus?.advert === 'pending' ? (
                            <div className="text-center text-muted-foreground">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                                <p className="mt-4">Generating your advert...</p>
                            </div>
                        ) : adError ? (
                             <Alert variant="destructive" className="max-w-md">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{adError}</AlertDescription>
                            </Alert>
                        ) : adHighlights || mainDescription ? (
                            <div className="prose prose-slate max-w-full w-full">
                                <h3>Property Highlights</h3>
                                <div className="mt-4 space-y-2">
                                    <ReactMarkdown
                                        components={{
                                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2" {...props} />,
                                            li: ({node, ...props}) => <li className="uppercase text-sm" {...props} />,
                                        }}
                                    >
                                        {adHighlights}
                                    </ReactMarkdown>
                                </div>
                                {mainDescription && (
                                    <div className="mt-6">
                                        <h3>Property Description</h3>
                                        <ReactMarkdown
                                            className="prose-sm"
                                            components={{
                                                p: ({node, ...props}) => <p className="text-sm text-foreground" {...props} />,
                                                strong: ({node, ...props}) => <strong className="font-semibold text-foreground text-sm mt-4 mb-2 block" {...props} />,
                                            }}
                                        >
                                            {mainDescription}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="text-center text-muted-foreground">
                                <p>Upload property photos and generate content to see the advert preview.</p>
                            </div>
                        )}
                    </CardContent>
                    {(adHighlights || mainDescription) && (generationStatus?.advert !== 'pending') && (
                        <CardFooter className="p-8 justify-between items-center border-t">
                             <div className="text-sm text-muted-foreground">
                                <span>Description: ~{mainDescription.split(' ').length} words ({mainDescription.length} characters)</span>
                            </div>
                            <Button onClick={() => copyToClipboard(adHighlights, 'highlights')}>
                                <Copy className="mr-2 h-4 w-4" /> Copy Highlights
                            </Button>
                        </CardFooter>
                    )}
                </TabsContent>

                <TabsContent value="local-area-info">
                    <CardContent className="p-8 min-h-[400px]">
                       {generationStatus?.localSummary === 'pending' ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                                <p className="mt-4">Generating local summary for {selectedArea}...</p>
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

                                <div className="pt-6 border-t">
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                                        <ShieldCheck className="w-5 h-5 text-primary"/>
                                        Conservation Area Check
                                    </h4>
                                    
                                    {isConservationLoading || generationStatus?.conservation === 'pending' ? (
                                      <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                                    ) : conservationError ? (
                                      <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{conservationError}</AlertDescription></Alert>
                                    ) : conservationResult ? (
                                        <Card className="max-w-lg">
                                            <CardHeader className="text-center">
                                                <CardTitle className="flex flex-col items-center gap-2">
                                                {conservationResult.inConservationArea ? (
                                                    <>
                                                        <ShieldCheck className="w-12 h-12 text-green-500"/>
                                                        <span>In a Conservation Area</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-12 h-12 text-muted-foreground"/>
                                                        <span>Not in a Conservation Area</span>
                                                    </>
                                                )}
                                                </CardTitle>
                                            </CardHeader>
                                            {conservationResult.inConservationArea && (
                                            <CardContent>
                                                <dl className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <dt className="text-muted-foreground">Area Name:</dt>
                                                        <dd className="font-semibold">{conservationResult.areaName}</dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-muted-foreground">Designation Date:</dt>
                                                        <dd className="font-semibold">{conservationResult.designationDate ? new Date(conservationResult.designationDate).toLocaleDateString('en-GB') : 'N/A'}</dd>
                                                    </div>
                                                     <div className="flex justify-between">
                                                        <dt className="text-muted-foreground">Further Information:</dt>
                                                        <dd className="font-semibold text-right">
                                                            <a href={conservationResult.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                                View Details
                                                            </a>
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </CardContent>
                                            )}
                                        </Card>
                                    ) : (
                                      <Button onClick={handleConservationLookup} disabled={isConservationLoading}>
                                        {isConservationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Check Conservation Status
                                      </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                             <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground text-center">Enter a postcode and select an area in the "Property Details" tab to generate a local area summary.</p>
                             </div>
                        )}
                    </CardContent>
                     {localSummary && (generationStatus?.localSummary !== 'pending') && (
                        <CardFooter className="p-8 justify-between items-center border-t">
                             <div className="text-sm text-muted-foreground">
                                <span>~{(localSummary.amenities.split(' ').length + localSummary.schools.split(' ').length + localSummary.transport.split(' ').length + localSummary.character.split(' ').length)} words</span>
                            </div>
                            <Button onClick={() => copyToClipboard(Object.values(localSummary).join('\n\n'), 'summary')}>
                                <Copy className="mr-2 h-4 w-4" /> Copy Summary
                            </Button>
                        </CardFooter>
                    )}
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
                                <p className="text-muted-foreground text-center">Enter a postcode in the "Property Details" tab to use the Property Checker.</p>
                            </div>
                        )}
                    </CardContent>
                </TabsContent>

                <TabsContent value="land-registry">
                    <CardContent className="p-0" style={{ height: '80vh' }}>
                        <iframe
                            src="https://www.gov.uk/get-information-about-property-and-land/copies-of-deeds"
                            title="Land Registry"
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                        />
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
                            <Button onClick={handleEpcLookup} disabled={isEpcLoading || !!generationStatus?.epc}>
                                {isEpcLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Search
                            </Button>
                        </div>

                        {epcError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{epcError}</AlertDescription></Alert>}

                        {(isEpcLoading || generationStatus?.epc === 'pending') && (
                            <div className="flex justify-center py-10">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {selectedEpc ? (
                            <Card>
                                <CardHeader>
                                    <Button variant="ghost" onClick={() => setSelectedEpc(null)} className="mb-2 w-fit p-0 h-auto text-primary hover:text-primary/80">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to results
                                    </Button>
                                    <CardTitle>{selectedEpc.address}</CardTitle>
                                    <CardDescription>LMK Key: {selectedEpc['lmk-key']}</CardDescription>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Property Details</h4>
                                        <ul className="space-y-2 text-sm border-t pt-4">
                                            <li className="flex justify-between"><span>Property Type:</span> <span className="font-medium text-right">{selectedEpc['property-type']}</span></li>
                                            <li className="flex justify-between"><span>Total Floor Area:</span> <span className="font-medium">{selectedEpc['total-floor-area']} m²</span></li>
                                            <li className="flex justify-between"><span>Build Date:</span> <span className="font-medium">{selectedEpc['construction-age-band']}</span></li>
                                            <li className="flex justify-between"><span>Council Tax Band:</span> <span className="font-medium text-right">{selectedEpc['council-tax-band'] || 'N/A'}</span></li>
                                            <li className="flex justify-between"><span>Lodgement Date:</span> <span className="font-medium">{formatDate(selectedEpc['lodgement-date'])}</span></li>
                                            <li className="flex justify-between items-center">
                                                <span>Expiry:</span>
                                                <span className="font-medium flex items-center gap-2">
                                                    {formatDate(calculatedExpiryDate)}
                                                    {isEpcExpired ? <Badge variant="destructive">Expired</Badge> : <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>}
                                                </span>
                                            </li>
                                        </ul>
                                         <h4 className="font-semibold pt-4 border-t">Energy Costs</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex justify-between"><span>Current Annual Cost:</span> <span className="font-medium">£{annualCostCurrent.toLocaleString()}</span></li>
                                            <li className="flex justify-between"><span>Potential Annual Cost:</span> <span className="font-medium">£{annualCostPotential.toLocaleString()}</span></li>
                                            <li className="flex justify-between"><span>Potential Saving:</span> <span className="font-medium text-green-600">£{(annualCostCurrent - annualCostPotential).toLocaleString()}</span></li>
                                        </ul>
                                    </div>
                                    <div className="max-w-sm mx-auto">
                                        <EpcStandardGraph 
                                            currentValue={safeParseInt(selectedEpc['current-energy-efficiency'])} 
                                            potentialValue={safeParseInt(selectedEpc['potential-energy-efficiency'])} 
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ) : epcResults.length > 0 && !isEpcLoading && generationStatus?.epc !== 'pending' ? (
                           <div>
                            <h3 className="text-lg font-semibold mb-4">Properties found with an EPC </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {epcResults.map((cert) => (
                                    <button key={cert['lmk-key']} onClick={() => handleSelectEpc(cert)} className="text-left">
                                      <EpcCardComponent record={cert} />
                                    </button>
                                ))}
                            </div>
                           </div>
                        ) : null}

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
                    <Button variant="outline" onClick={() => onRotate(-90)}>Rotate Left</Button>
                    <Button variant="outline" onClick={() => onRotate(90)}>Rotate Right</Button>
                    <Button variant="secondary" onClick={closeEditor}>Cancel</Button>
                    <Button onClick={onCrop}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
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
        <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all inputs and generated content. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestart}>
                  Confirm Restart
                </AlertDialogAction>
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

