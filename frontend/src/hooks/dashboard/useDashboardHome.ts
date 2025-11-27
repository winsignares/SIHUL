import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
    dashboardHomeStats,
    dashboardHomeActivities,
    dashboardHomeQuickStats,
    dashboardHomeOccupationDetails,
    dashboardHomeOccupationStats
} from '../../services/dashboard.data';

export function useDashboardHome() {
    const { showNotification } = useTheme();

    // State
    const [showReportModal, setShowReportModal] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);
    const [showOccupationDetails, setShowOccupationDetails] = useState(false);
    const [showAllActivities, setShowAllActivities] = useState(false);
    const [activities, setActivities] = useState(dashboardHomeActivities);

    // Derived state
    const recentActivities = activities.slice(0, 4);

    // Handlers
    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        setReportGenerated(false);

        setTimeout(() => {
            setIsGeneratingReport(false);
            setReportGenerated(true);

            setTimeout(() => {
                showNotification({ message: '✅ El reporte ha sido generado exitosamente', type: 'success' });
                setShowReportModal(false);
                setReportGenerated(false);
            }, 1500);
        }, 2000);
    };

    const markActivityAsCompleted = (activityId: string) => {
        setActivities(prev =>
            prev.map(activity =>
                activity.id === activityId
                    ? { ...activity, status: 'completed' }
                    : activity
            )
        );
        showNotification({ message: 'Actividad marcada como realizada', type: 'success' });
    };

    return {
        stats: dashboardHomeStats,
        activities,
        recentActivities,
        quickStats: dashboardHomeQuickStats,
        occupationDetails: dashboardHomeOccupationDetails,
        occupationStats: dashboardHomeOccupationStats,
        state: {
            showReportModal,
            isGeneratingReport,
            reportGenerated,
            showOccupationDetails,
            showAllActivities
        },
        setters: {
            setShowReportModal,
            setShowOccupationDetails,
            setShowAllActivities
        },
        handlers: {
            handleGenerateReport,
            markActivityAsCompleted
        }
    };
}
