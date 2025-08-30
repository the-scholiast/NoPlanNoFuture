'use client'

import React, { Suspense } from 'react';
import RadialPlanner from '../../../components/RadialPlanner/RadialPlanner';

function PlannerContent() {
    return (
        <div className="App">
            <RadialPlanner />
        </div>
    );
}

function PlannerLoading() {
    return (
        <div className="flex items-center justify-center p-4">
            <div>Loading planner...</div>
        </div>
    );
}

export default function PlannerPage() {
    return (
        <Suspense fallback={<PlannerLoading />}>
            <PlannerContent />
        </Suspense>
    );
}