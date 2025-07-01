// frontend/src/modules/loyalpyme/components/admin/StatCard.test.tsx
// Version 1.0.3 - Corrected theme import path

import React from 'react';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { describe, it, expect } from 'vitest';
import StatCard from './StatCard';
import { IconUsers } from '@tabler/icons-react';
import { MantineProvider } from '@mantine/core';

// --- CORRECCIÓN DE RUTA ---
import { theme } from '../../../../theme';
// --- FIN CORRECCIÓN ---

describe('StatCard Component', () => {

    const renderWithTheme = (ui: React.ReactElement) => {
        return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
    };

    it('should render title and value correctly', () => {
        renderWithTheme(<StatCard title="CLIENTES" value={123} />);
        expect(screen.getByText('CLIENTES')).toBeInTheDocument();
        expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should render icon when provided', () => {
        renderWithTheme(<StatCard title="Test" value={10} icon={<IconUsers data-testid="users-icon" size={24}/>} />);
        expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });

    it('should render "-" when value is null or undefined', () => {
        const { rerender } = renderWithTheme(<StatCard title="Test Null" value={null} />);
        expect(screen.getByText('-')).toBeInTheDocument();

        rerender(<MantineProvider theme={theme}><StatCard title="Test Undefined" value={undefined} /></MantineProvider>);
        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render trend up icon and value correctly', () => {
        renderWithTheme(<StatCard title="Trend Up" value={100} trendValue="+10.5%" trendDirection="up" />);
        expect(screen.getByText('+10.5%')).toBeInTheDocument();
    });

    it('should render trend down icon and value correctly', () => {
        renderWithTheme(<StatCard title="Trend Down" value={90} trendValue="-5.0%" trendDirection="down" />);
        expect(screen.getByText('-5.0%')).toBeInTheDocument();
    });

     it('should render neutral trend value without arrow', () => {
        const { rerender } = renderWithTheme(<StatCard title="Trend Neutral" value={100} trendValue="N/A" trendDirection="neutral" />);
        expect(screen.getByText('N/A')).toBeInTheDocument();

        rerender(<MantineProvider theme={theme}><StatCard title="Trend Zero" value={100} trendValue="+0.0%" trendDirection="neutral" /></MantineProvider>);
        expect(screen.getByText('+0.0%')).toBeInTheDocument();
    });

    it('should not render trend section if trendValue is null/undefined', () => {
        renderWithTheme(<StatCard title="No Trend" value={100} trendValue={null} trendDirection="neutral" />);
        expect(screen.queryByText(/%/)).not.toBeInTheDocument();
        expect(screen.queryByText('+')).not.toBeInTheDocument();
    });

    it('should display skeletons when loading', () => {
        renderWithTheme(<StatCard title="Loading Test" value={null} loading={true} />);
        expect(screen.queryByText(/-/)).not.toBeInTheDocument();
        expect(screen.getByText('Loading Test')).toBeInTheDocument();
    });
});