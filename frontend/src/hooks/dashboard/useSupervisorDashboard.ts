import {
    supervisorMetrics,
    supervisorQuickActions,
    supervisorActivityLogs
} from '../../services/dashboard.data';

export function useSupervisorDashboard() {
    return {
        metricsCards: supervisorMetrics,
        quickActions: supervisorQuickActions,
        activityLogs: supervisorActivityLogs
    };
}
