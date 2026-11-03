
import { config } from 'dotenv';
config({ path: '.env.local' });

import '@/ai/flows/analyze-real-estate-data.ts';
import '@/ai/flows/analyze-valuation-data.ts';
import '@/ai/flows/generate-floor-plan-from-drawing.ts';
import '@/ai/flows/generate-social-video.ts';
import '@/ai/flows/generate-social-post.ts';
import '@/ai/flows/analyze-floor-plan.ts';
import '@/ai/flows/client-postcode-lookup.ts';
import '@/ai/flows/epc-lookup.ts';
import '@/ai/flows/conservation-area-lookup.ts';
import '@/ai/flows/generic-chat.ts';
import '@/ai/flows/edit-image-flow.ts';
import '@/ai/flows/generate-valuation-report.ts';
import '@/ai/flows/eacaller-flow.ts';
import '@/ai/flows/creator-studio-flow.ts';
import '@/ai/flows/measure-room-from-360.ts';
import '@/ai/flows/alto-update-flow.ts';
import '@/ai/flows/describe-rooms-from-photos.ts';
import '@/ai/flows/generate-brochure-flow.ts';

