import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../api';
import ErrorBanner from './ErrorBanner';


const emptyMission = {
  name: '',
  slug: '',
  description: '',
  status: 'planned',
  mission_type: 'crewed',
  launch_datetime: '',
  launch_time_mode: 'local',
  vehicle_name: '',
  tracking_identifier: '',
  tracking_type: 'satellite',
  active: true,
};


function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}


function formatLocalDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}


function formatUtcDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}


function fromMission(mission) {
  if (!mission) return emptyMission;
  return {
    name: mission.name || '',
    slug: mission.slug || '',
    description: mission.description || '',
    status: mission.status || 'planned',
    mission_type: mission.mission_type || 'crewed',
    launch_datetime: toInputDateTime(mission.launch_datetime),
    launch_time_mode: 'local',
    vehicle_name: mission.vehicle_name || '',
    tracking_identifier: mission.tracking_identifier || '',
    tracking_type: mission.tracking_type || 'satellite',
    active: mission.active ?? true,
  };
}


function toUtcIso(value, mode) {
  if (!value) return null;

  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) return null;

  if (mode === 'utc') {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0)).toISOString();
  }

  if (mode === 'ist') {
    const utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0) - (330 * 60 * 1000);
    return new Date(utcMillis).toISOString();
  }

  return new Date(value).toISOString();
}


function buildPayload(form) {
  return {
    ...form,
    slug: form.slug || null,
    description: form.description || null,
    mission_type: form.mission_type || null,
    launch_datetime: toUtcIso(form.launch_datetime, form.launch_time_mode),
    vehicle_name: form.vehicle_name || null,
    tracking_identifier: form.tracking_identifier || null,
    tracking_type: form.tracking_identifier ? (form.tracking_type || 'satellite') : null,
  };
}


export default function MissionPanel() {
  const queryClient = useQueryClient();
  const [selectedMissionId, setSelectedMissionId] = useState(null);
  const [form, setForm] = useState(emptyMission);
  const [formError, setFormError] = useState('');

  const missions = useQuery({
    queryKey: ['missions'],
    queryFn: () => api.missions(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!missions.data?.length) {
      setSelectedMissionId(null);
      setForm(emptyMission);
      return;
    }

    const selected = missions.data.find((mission) => mission.id === selectedMissionId);
    const nextMission = selected || missions.data[0];
    setSelectedMissionId(nextMission.id);
    setForm(fromMission(nextMission));
  }, [missions.data, selectedMissionId]);

  const selectedMission = missions.data?.find((mission) => mission.id === selectedMissionId) || null;

  const track = useQuery({
    queryKey: ['missionTrack', selectedMissionId, selectedMission?.tracking_identifier],
    queryFn: () => api.missionTrack(selectedMissionId, 1, 60),
    enabled: selectedMissionId !== null && !!selectedMission?.tracking_identifier,
    staleTime: 60_000,
  });

  const createMission = useMutation({
    mutationFn: (payload) => api.missionCreate(payload),
    onSuccess: async () => {
      setFormError('');
      setForm(emptyMission);
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
    onError: (error) => setFormError(error.message),
  });

  const updateMission = useMutation({
    mutationFn: ({ id, payload }) => api.missionUpdate(id, payload),
    onSuccess: async () => {
      setFormError('');
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
      await queryClient.invalidateQueries({ queryKey: ['missionTrack'] });
    },
    onError: (error) => setFormError(error.message),
  });

  const deleteMission = useMutation({
    mutationFn: (id) => api.missionDelete(id),
    onSuccess: async () => {
      setFormError('');
      setSelectedMissionId(null);
      setForm(emptyMission);
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
      await queryClient.invalidateQueries({ queryKey: ['missionTrack'] });
    },
    onError: (error) => setFormError(error.message),
  });

  const currentTrack = track.data?.tracking?.current;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4">
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm text-muted">Mission registry</div>
            <div className="text-lg font-semibold">Tracked missions</div>
          </div>
          <button
            className="px-3 py-1 rounded-lg border border-border text-sm"
            onClick={() => {
              setSelectedMissionId(null);
              setForm(emptyMission);
              setFormError('');
            }}
          >
            New
          </button>
        </div>

        {missions.isLoading && <div className="text-sm text-muted">Loading missions...</div>}
        {missions.error && <ErrorBanner message={`Failed to load missions: ${missions.error.message}`} onRetry={missions.refetch} />}

        <div className="space-y-2">
          {(missions.data || []).map((mission) => (
            <button
              key={mission.id}
              className={`w-full text-left rounded-xl border px-3 py-3 ${selectedMissionId === mission.id ? 'border-accent bg-white/5' : 'border-border'}`}
              onClick={() => {
                setSelectedMissionId(mission.id);
                setForm(fromMission(mission));
                setFormError('');
              }}
            >
              <div className="font-semibold">{mission.name}</div>
              <div className="text-sm text-muted">{mission.status} {mission.vehicle_name ? `• ${mission.vehicle_name}` : ''}</div>
              <div className="text-xs text-muted">{mission.tracking_identifier || 'No tracking linked'}</div>
              {mission.launch_datetime && (
                <div className="mt-2 text-xs text-muted">
                  <div>Local: {formatLocalDateTime(mission.launch_datetime)}</div>
                  <div>UTC: {formatUtcDateTime(mission.launch_datetime)}</div>
                </div>
              )}
            </button>
          ))}
          {!missions.isLoading && !missions.data?.length && <div className="text-sm text-muted">No missions yet.</div>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-4 space-y-4">
          <div>
            <div className="text-sm text-muted">Mission details</div>
            <div className="text-lg font-semibold">{selectedMission ? `Edit ${selectedMission.name}` : 'Create a mission'}</div>
          </div>

          {formError && <ErrorBanner message={formError} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm text-muted">Name</span>
              <input className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-muted">Slug</span>
              <input className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="auto-generated if blank" />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-muted">Status</span>
              <input className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-muted">Mission type</span>
              <input className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2" value={form.mission_type} onChange={(e) => setForm((prev) => ({ ...prev, mission_type: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-muted">Launch datetime</span>
              <input className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2" type="datetime-local" value={form.launch_datetime} onChange={(e) => setForm((prev) => ({ ...prev, launch_datetime: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-muted">Launch time mode</span>
              <select className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2" value={form.launch_time_mode} onChange={(e) => setForm((prev) => ({ ...prev, launch_time_mode: e.target.value }))}>
                <option value="local">Local (this browser)</option>
                <option value="utc">UTC</option>
                <option value="ist">IST (UTC+05:30)</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm text-muted">Vehicle</span>
              <input className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2" value={form.vehicle_name} onChange={(e) => setForm((prev) => ({ ...prev, vehicle_name: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-muted">Tracking identifier</span>
              <input className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2" value={form.tracking_identifier} onChange={(e) => setForm((prev) => ({ ...prev, tracking_identifier: e.target.value }))} placeholder="ISS or NORAD ID" />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-muted">Tracking type</span>
              <input className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2" value={form.tracking_type} onChange={(e) => setForm((prev) => ({ ...prev, tracking_type: e.target.value }))} />
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-sm text-muted">Description</span>
            <textarea className="w-full min-h-28 rounded-lg border border-border bg-[#0f1620] px-3 py-2" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </label>

          <div className="text-xs text-muted">
            Launch time is converted and stored in UTC. Cards show both your local timezone and UTC.
          </div>

          {selectedMission?.launch_datetime && (
            <div className="rounded-lg border border-border bg-[#0f1620] px-3 py-2 text-xs text-muted space-y-1">
              <div>Saved launch (Local): {formatLocalDateTime(selectedMission.launch_datetime)}</div>
              <div>Saved launch (UTC): {formatUtcDateTime(selectedMission.launch_datetime)}</div>
            </div>
          )}

          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
            Mission is active
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-accent text-slate-900 font-semibold"
              onClick={() => {
                if (!form.name.trim()) {
                  setFormError('Mission name is required.');
                  return;
                }
                const payload = buildPayload(form);
                if (selectedMissionId === null) {
                  createMission.mutate(payload);
                  return;
                }
                updateMission.mutate({ id: selectedMissionId, payload });
              }}
              disabled={createMission.isPending || updateMission.isPending}
            >
              {selectedMissionId === null ? 'Create mission' : 'Save changes'}
            </button>
            {selectedMissionId !== null && (
              <button
                className="px-4 py-2 rounded-lg border border-border"
                onClick={() => deleteMission.mutate(selectedMissionId)}
                disabled={deleteMission.isPending}
              >
                Deactivate mission
              </button>
            )}
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <div className="text-sm text-muted">Live mission tracking</div>
          {!selectedMission && <div className="text-sm text-muted">Select a mission to load tracking.</div>}
          {selectedMission && !selectedMission.tracking_identifier && (
            <div className="text-sm text-muted">This mission does not have a tracking identifier yet.</div>
          )}
          {track.error && <ErrorBanner message={`Mission track error: ${track.error.message}`} onRetry={track.refetch} />}
          {track.isLoading && <div className="text-sm text-muted">Loading track...</div>}
          {currentTrack && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl border border-border px-3 py-3 bg-[#0f1620]">
                <div className="text-muted text-xs uppercase tracking-wide">Latitude</div>
                <div className="text-lg font-semibold">{currentTrack.lat}</div>
              </div>
              <div className="rounded-xl border border-border px-3 py-3 bg-[#0f1620]">
                <div className="text-muted text-xs uppercase tracking-wide">Longitude</div>
                <div className="text-lg font-semibold">{currentTrack.lon}</div>
              </div>
              <div className="rounded-xl border border-border px-3 py-3 bg-[#0f1620]">
                <div className="text-muted text-xs uppercase tracking-wide">Altitude</div>
                <div className="text-lg font-semibold">{currentTrack.alt_km} km</div>
              </div>
              <div className="rounded-xl border border-border px-3 py-3 bg-[#0f1620]">
                <div className="text-muted text-xs uppercase tracking-wide">Timestamp</div>
                <div className="text-sm font-semibold break-words">{currentTrack.timestamp_utc}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}