import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth.store';

export function Profile() {
  const { user } = useAuthStore();

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ color: '#fff' }}>My Profile</h2>
      <div style={{ background: '#16213e', borderRadius: 12, padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#aaa', fontSize: 13 }}>Username</div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>{user?.username}</div>
        </div>
        <div>
          <div style={{ color: '#aaa', fontSize: 13 }}>Email</div>
          <div style={{ color: '#fff' }}>{user?.email}</div>
        </div>
      </div>
    </div>
  );
}
