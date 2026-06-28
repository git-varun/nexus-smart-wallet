// src/entities/capability/ui/FeatureGate.tsx
import React from 'react';
import { useCapabilityContext, FeatureType } from '../model/CapabilityContext';

export interface FeatureGateProps {
    feature: FeatureType;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
    feature,
    children,
    fallback = null
}) => {
    const { hasCapability, isLoading } = useCapabilityContext();

    if (isLoading) {
        return null;
    }

    return hasCapability(feature) ? <>{children}</> : <>{fallback}</>;
};
