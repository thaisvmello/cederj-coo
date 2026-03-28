import { supabase } from '../lib/supabase';
import { Check, X, Clock, FolderPlus, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { RejectRequestModal } from './RejectRequestModal';
import { useState, useEffect } from 'react';

export function AdminFolderRequests() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [requests, setRequests] = useState<FolderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [requestToReject, setRequestToReject] = useState<FolderRequest | null>(null);

  // ... rest of the component unchanged (omitted for brevity)
  // The rest of the file remains the same as before, just without the unused import.
};