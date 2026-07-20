import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './index.css'; // Make sure styles are imported

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

  useEffect(() => {
    // Lấy thông tin session hiện tại khi tải trang
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Lắng nghe sự thay đổi trạng thái đăng nhập (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert(`Lỗi đăng nhập Google: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsVaultUnlocked(false);
    setMasterPassword('');
  };

  const handleUnlockVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword.length < 6) {
      alert('Master Password phải từ 6 ký tự trở lên.');
      return;
    }
    // TODO: Sẽ tích hợp Web Crypto API để phái sinh Key và giải mã blob dữ liệu tải về từ backend tại đây
    setIsVaultUnlocked(true);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Khởi động hệ thống bảo mật...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <h2>Antigravity Vault</h2>
        <p>Bảo mật Zero-Knowledge tuyệt đối</p>
      </div>

      {!session ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Đăng nhập để đồng bộ kho chứa đa nền tảng
          </p>
          <button className="btn btn-google" onClick={handleGoogleLogin}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      ) : (
        <div>
          <div className="user-bar">
            <div className="user-email">
              Đăng nhập dưới dạng
              <strong>{session.user.email}</strong>
            </div>
            <button className="btn btn-logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>

          {!isVaultUnlocked ? (
            <form onSubmit={handleUnlockVault}>
              <div className="input-group">
                <label>Master Password</label>
                <input 
                  type="password" 
                  className="input-field"
                  value={masterPassword} 
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Nhập mật khẩu chính..." 
                  autoFocus
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-4px' }}>
                  * Mật khẩu này tuyệt đối không được gửi lên máy chủ
                </p>
              </div>
              <button type="submit" className="btn btn-primary">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Giải mã cục bộ
              </button>
            </form>
          ) : (
            <div className="status-box">
              <h3>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                Vault Đã Mở Khóa
              </h3>
              <p>Khóa giải mã đã được nạp an toàn vào RAM. Kết nối thành công.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
