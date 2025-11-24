import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import LogModal from './LogModal';
import { mockLogs } from '../data/mockData';

const Diary = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState(mockLogs);
    const [filteredLogs, setFilteredLogs] = useState(mockLogs);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

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
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .eq('user_id', user.id)
                .order('visit_date', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                setLogs(data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
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
            } else if (timeFilter === '90days') {
                filterDate.setDate(now.getDate() - 90);
            } else if (timeFilter === 'year') {
                filterDate.setFullYear(now.getFullYear() - 1);
            }

            filtered = filtered.filter(log => {
                const logDate = new Date(log.visit_date);
                return logDate >= filterDate;
            });
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

    // Get unique cuisines and locations from logs
    const uniqueCuisines = [...new Set(logs.map(log => log.cuisine).filter(Boolean))];
    const uniqueLocations = [...new Set(logs.map(log => log.location).filter(Boolean))];

    return (
        <div className="diary-container">
            <div className="diary-header">
                <h2>My Food Diary</h2>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    + New Entry
                </button>
            </div>

            <div className="diary-layout">
                {/* Left Sidebar - Category Filters */}
                <aside className="diary-sidebar diary-sidebar-left">
                    <div className="filter-section">
                        <h3>Filter by Cuisine</h3>
                        <div className="filter-options">
                            <button
                                className={`filter-btn ${cuisineFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setCuisineFilter('all')}
                            >
                                All Cuisines
                            </button>
                            {uniqueCuisines.map(cuisine => (
                                <button
                                    key={cuisine}
                                    className={`filter-btn ${cuisineFilter === cuisine ? 'active' : ''}`}
                                    onClick={() => setCuisineFilter(cuisine)}
                                >
                                    {cuisine}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>Filter by Location</h3>
                        <div className="filter-options">
                            <button
                                className={`filter-btn ${locationFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setLocationFilter('all')}
                            >
                                All Locations
                            </button>
                            {uniqueLocations.map(location => (
                                <button
                                    key={location}
                                    className={`filter-btn ${locationFilter === location ? 'active' : ''}`}
                                    onClick={() => setLocationFilter(location)}
                                >
                                    {location}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="diary-main">
                    {loading && <p className="loading">Loading your diary...</p>}

                    {!loading && filteredLogs.length === 0 && (
                        <div className="empty-state">
                            <p className="empty-icon">📔</p>
                            <p className="empty-title">No entries found</p>
                            <p className="empty-description">
                                {logs.length === 0
                                    ? 'Start your food diary by creating your first entry!'
                                    : 'Try adjusting your filters to see more entries.'}
                            </p>
                        </div>
                    )}

                    <div className="logs-grid">
                        {filteredLogs.map((log) => (
                            <LogCard key={log.id} log={log} />
                        ))}
                    </div>
                </main>

                {/* Right Sidebar - Time Filters */}
                <aside className="diary-sidebar diary-sidebar-right">
                    <div className="filter-section">
                        <h3>Time Period</h3>
                        <div className="filter-options">
                            <button
                                className={`filter-btn ${timeFilter === 'week' ? 'active' : ''}`}
                                onClick={() => setTimeFilter('week')}
                            >
                                📅 This Week
                            </button>
                            <button
                                className={`filter-btn ${timeFilter === '90days' ? 'active' : ''}`}
                                onClick={() => setTimeFilter('90days')}
                            >
                                📊 Last 90 Days
                            </button>
                            <button
                                className={`filter-btn ${timeFilter === 'year' ? 'active' : ''}`}
                                onClick={() => setTimeFilter('year')}
                            >
                                📆 Last Year
                            </button>
                            <button
                                className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setTimeFilter('all')}
                            >
                                🗂️ All Time
                            </button>
                        </div>

                        <div className="filter-stats">
                            <p className="stat-item">
                                <span className="stat-label">Showing:</span>
                                <span className="stat-value">{filteredLogs.length} entries</span>
                            </p>
                            <p className="stat-item">
                                <span className="stat-label">Total:</span>
                                <span className="stat-value">{logs.length} entries</span>
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            {showModal && (
                <LogModal
                    onClose={() => setShowModal(false)}
                    onLogCreated={handleLogCreated}
                />
            )}
        </div>
    );
};

export default Diary;
