import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import LogCard from './LogCard';
import LogModal from './LogModal';

const Feed = ({ onViewProfile }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .neq('user_id', user.id) // Exclude own logs from feed
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogCreated = (newLog) => {
        setLogs([newLog, ...logs]);
        setShowModal(false);
    };

    return (
        <div className="feed-container">
            <div className="feed-header">
                <h2>Food Logs</h2>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    + New Log
                </button>
            </div>

            {loading && <p className="loading">Loading logs...</p>}

            <div className="logs-grid">
                {logs.map((log) => (
                    <LogCard
                        key={log.id}
                        log={log}
                        onViewProfile={onViewProfile}
                    />
                ))}
            </div>

            {logs.length === 0 && !loading && (
                <p className="no-logs">No logs yet. Create your first one!</p>
            )}

            {showModal && (
                <LogModal
                    onClose={() => setShowModal(false)}
                    onLogCreated={handleLogCreated}
                />
            )}
        </div>
    );
};

export default Feed;
