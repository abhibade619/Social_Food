import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import LogModal from './LogModal';
import EditLogModal from './EditLogModal';

const Diary = ({ onRestaurantClick }) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingLog, setEditingLog] = useState(null);

    // Filter states
    const [timeFilter, setTimeFilter] = useState('all');
    const [cuisineFilter, setCuisineFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [timeFilter, cuisineFilter, locationFilter, logs]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Fetch user's own logs
            const { data: ownLogs, error: ownError } = await supabase
                .from('logs')
                .select('*')
                .eq('user_id', user.id)
                .order('visit_date', { ascending: false });

            if (ownError) throw ownError;

            // Fetch logs where user is tagged AND accepted to show in diary
            const { data: taggedData, error: taggedError } = await supabase
                .from('tagged_users')
                .select('log_id')
                .eq('user_id', user.id)
                .eq('show_in_diary', true);

            if (taggedError) throw taggedError;

            let taggedLogs = [];
            if (taggedData && taggedData.length > 0) {
                const taggedLogIds = taggedData.map(t => t.log_id);
                const { data: taggedLogsData, error: taggedLogsError } = await supabase
                    .from('logs')
                    .select('*')
                    .in('id', taggedLogIds)
                    .order('visit_date', { ascending: false });

                if (!taggedLogsError && taggedLogsData) {
                    taggedLogs = taggedLogsData;
                }
            }

            // Combine and deduplicate logs
            const allLogs = [...(ownLogs || []), ...taggedLogs];
            const uniqueLogs = Array.from(new Map(allLogs.map(log => [log.id, log])).values());

            // Sort by visit_date
            uniqueLogs.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

            setLogs(uniqueLogs);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...logs];

        // Time filter
        if (timeFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            if (timeFilter === 'week') {
                filterDate.setDate(now.getDate() - 7);
                filtered = filtered.filter(log => new Date(log.visit_date) >= filterDate);
            } else if (timeFilter === 'month') {
                // Filter for current month
                filtered = filtered.filter(log => {
                    const logDate = new Date(log.visit_date);
                    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                });
            } else if (timeFilter === 'year') {
                // Filter for current year
                filtered = filtered.filter(log => {
                    const logDate = new Date(log.visit_date);
                    return logDate.getFullYear() === now.getFullYear();
                });
            }
        }

        // Cuisine filter
        if (cuisineFilter !== 'all') {
            filtered = filtered.filter(log => log.cuisine === cuisineFilter);
        }

        // Location filter
        if (locationFilter !== 'all') {
            filtered = filtered.filter(log => log.location === locationFilter);
        }

        setFilteredLogs(filtered);
    };

    const handleLogCreated = (newLog) => {
        setLogs([newLog, ...logs]);
        setShowModal(false);
    };

    const handleEdit = (log) => {
        setEditingLog(log);
    };

    const handleLogUpdated = (updatedLog) => {
        setLogs(logs.map(log => log.id === updatedLog.id ? updatedLog : log));
        setEditingLog(null);
    };

    const handleDelete = async (logId) => {
        try {
            const { error } = await supabase
                .from('logs')
                .delete()
                .eq('id', logId)
                .eq('user_id', user.id);

            if (error) throw error;

            setLogs(logs.filter(log => log.id !== logId));
        } catch (error) {
            console.error('Error deleting log:', error);
            alert('Failed to delete log');
        }
    };

    // Get unique cuisines and locations from logs
    const uniqueCuisines = [...new Set(logs.map(log => log.cuisine).filter(Boolean))];
    const uniqueLocations = [...new Set(logs.map(log => log.location).filter(Boolean))];

    return (
        <div className="diary-container container">
            <div className="diary-header-premium">
                <div className="diary-title-section">
                    <h1>My Culinary Journal</h1>
                    <p className="diary-subtitle">Documenting your gastronomic adventures.</p>
                </div>
                <button className="btn-primary new-entry-btn" onClick={() => setShowModal(true)}>
                    <span className="plus-icon">+</span> New Entry
                </button>
            </div>

            <div className="diary-layout-premium">
                {/* Main Content */}
                <main className="diary-main">
                    {loading && <div className="loading-spinner"></div>}

                    {!loading && filteredLogs.length === 0 && (
                        <div className="empty-state glass-panel">
                            <div className="empty-icon">📔</div>
                            <p>Start documenting your food journey today.</p>
                        </div>
                    )}

                    <div className="logs-grid">
                        {filteredLogs.map((log) => (
                            <LogCard
                                key={log.id}
                                log={log}
                                showActions={true}
                                isDiaryView={true}
                                profileOwner={user}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onClick={() => handleEdit(log)}
                                onRestaurantClick={onRestaurantClick}
                            />
                        ))}
                    </div>
                </main>

                {/* Right Sidebar - Filters */}
                <aside className="diary-sidebar glass-panel">
                    <h3>Filters</h3>

                    <div className="filter-group">
                        <label>Time Period</label>
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Time</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Cuisine</label>
                        <select
                            value={cuisineFilter}
                            onChange={(e) => setCuisineFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Cuisines</option>
                            {uniqueCuisines.map(cuisine => (
                                <option key={cuisine} value={cuisine}>{cuisine}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Location</label>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Locations</option>
                            {uniqueLocations.map(location => (
                                <option key={location} value={location}>{location}</option>
                            ))}
                        </select>
                    </div>
                </aside>
            </div>

            {showModal && (
                <LogModal
                    onClose={() => setShowModal(false)}
                    onLogCreated={handleLogCreated}
                />
            )}

            {editingLog && (
                <EditLogModal
                    log={editingLog}
                    onClose={() => setEditingLog(null)}
                    onLogUpdated={handleLogUpdated}
                />
            )}
        </div>
    );
};

export default Diary;
