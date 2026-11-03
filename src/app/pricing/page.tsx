'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PricingPlan {
    id: string;
    planName: string;
    planPrice: string;
    planSubtitle: string;
    features: string[];
    highlighted: boolean;
    ctaText: string;
    ctaLink: string;
}

interface FeatureComparison {
    id: string;
    featureName: string;
    [planName: string]: boolean | string;
}

interface CtaContent {
    headline: string;
    button1Text: string;
    button1Link: string;
    button2Text: string;
    button2Link: string;
}

export default function PricingPage() {
    const { firestore: db } = useFirebase();
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [features, setFeatures] = useState<FeatureComparison[]>([]);
    const [ctaContent, setCtaContent] = useState<CtaContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db) return;

        const unsubPlans = onSnapshot(
            query(collection(db, 'pricingPlans'), orderBy('planPrice')),
            (snapshot) => {
                const fetchedPlans = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as PricingPlan));
                setPlans(fetchedPlans);
                setIsLoading(false);
            },
            (error) => {
                console.error('Error fetching pricing plans: ', error);
                setIsLoading(false);
            }
        );

        const unsubFeatures = onSnapshot(collection(db, 'featureComparison'), (snapshot) => {
            setFeatures(
                snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as FeatureComparison))
            );
        });

        const unsubCta = onSnapshot(doc(db, 'ctaSection', 'main'), (docSnap) => {
            if (docSnap.exists()) {
                setCtaContent(docSnap.data() as CtaContent);
            }
        });

        return () => {
            unsubPlans();
            unsubFeatures();
            unsubCta();
        };
    }, [db]);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
        }),
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground">
            <section className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-indigo-700/10 px-4 py-24 text-center text-foreground sm:py-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="z-10"
                >
                    <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                        Choose the Perfect Plan for You
                    </h1>
                    <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
                        Flexible pricing for every agent, agency, and partner - scale with the tools that grow your business.
                    </p>
                    <div className="mt-8">
                        <Button
                            asChild
                            size="lg"
                            className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg transition-transform hover:scale-105"
                        >
                            <Link href="/signup">Start Free Trial</Link>
                        </Button>
                    </div>
                </motion.div>
            </section>

            <section className="py-20 sm:py-28">
                <div className="container mx-auto px-6 sm:px-8">
                    <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.id}
                                custom={index}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.3 }}
                                variants={cardVariants}
                                className={cn(
                                    'relative flex flex-col rounded-2xl border p-8 transition-all duration-300',
                                    plan.highlighted
                                        ? 'border-primary -translate-y-4 shadow-2xl shadow-primary/10'
                                        : 'border-border shadow-lg'
                                )}
                            >
                                {plan.highlighted && (
                                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                                        <span className="inline-flex items-center rounded-full border bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <h3 className="text-xl font-semibold text-foreground">{plan.planName}</h3>
                                <p className="mt-2 text-muted-foreground">{plan.planSubtitle}</p>
                                <p className="font-heading mt-6 text-4xl font-bold">
                                    {plan.planPrice.startsWith('£') ? (
                                        <>
                                            <span className="text-3xl font-normal">£</span>
                                            {plan.planPrice.substring(1)}
                                        </>
                                    ) : (
                                        plan.planPrice
                                    )}
                                </p>

                                <ul className="mt-8 flex-1 space-y-4 text-muted-foreground">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    asChild
                                    size="lg"
                                    className={cn(
                                        'mt-10 w-full',
                                        plan.highlighted
                                            ? 'bg-primary'
                                            : 'bg-secondary text-secondary-foreground'
                                    )}
                                >
                                    <Link href={plan.ctaLink}>{plan.ctaText}</Link>
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {features.length > 0 && (
                <section className="bg-slate-50 py-20 dark:bg-slate-900/80 sm:py-28">
                    <div className="container mx-auto px-6 sm:px-8">
                        <div className="mx-auto mb-16 max-w-3xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                Feature Comparison
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr>
                                        <th className="w-1/3 p-4"></th>
                                        {plans.map((plan) => (
                                            <th
                                                key={plan.id}
                                                className="p-4 text-center font-semibold text-foreground"
                                            >
                                                {plan.planName}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {features.map((feature, index) => (
                                        <tr
                                            key={feature.id}
                                            className={cn(index % 2 === 0 ? 'bg-background' : 'bg-card')}
                                        >
                                            <td className="p-4 font-medium">{feature.featureName}</td>
                                            {plans.map((plan) => (
                                                <td key={plan.id} className="p-4 text-center">
                                                    {feature[plan.planName] ? (
                                                        <Check className="mx-auto h-6 w-6 text-green-500" />
                                                    ) : (
                                                        <span className="text-2xl text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {ctaContent && (
                <section className="bg-gradient-to-r from-blue-800 to-indigo-900 py-20 text-white sm:py-28">
                    <div className="container mx-auto px-6 sm:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                {ctaContent.headline}
                            </h2>
                            <div className="mt-8 flex flex-wrap justify-center gap-4">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg transition-transform hover:scale-105 hover:brightness-110"
                                    asChild
                                >
                                    <Link href={ctaContent.button1Link}>{ctaContent.button1Text}</Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-blue-800"
                                    asChild
                                >
                                    <Link href={ctaContent.button2Link}>{ctaContent.button2Text}</Link>
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>
            )}
        </div>
    );
}
