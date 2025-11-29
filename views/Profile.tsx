
import React, { useState, useEffect } from 'react';
import { User, AppSettings } from '../types';
import { db } from '../services/mockDb';
import { notify } from '../services/events';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [phone, setPhone] = useState(user.phone);
  const [password, setPassword] = useState(user.password || '');
  const [avatar, setAvatar] = useState(user.avatar_url || '');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setSettings(db.getSettings());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updated = db.updateProfile(user.id, { username, phone, password, avatar_url: avatar });
    if(updated) {
        setEditMode(false);
        notify("Profile updated successfully!", "success");
        setTimeout(() => window.location.reload(), 500);
    } else {
        notify("Update failed. Username might be taken.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-6">
        <div className="w-28 h-28 rounded-full flex items-center justify-center mb-4 border-4 border-gray-800 shadow-xl overflow-hidden bg-gray-800 relative">
          {editMode ? (
             <>
               <img src={avatar || "https://placehold.co/100"} className="w-full h-full object-cover opacity-50" />
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
               <i className="fa-solid fa-camera absolute text-white text-2xl pointer-events-none"></i>
             </>
          ) : (
             avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                <i className="fa-solid fa-user text-4xl text-gray-500"></i>
             )
          )}
        </div>
        
        {editMode ? (
            <input value={username} onChange={e => setUsername(e.target.value)} className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-center font-bold" />
        ) : (
            <h2 className="text-2xl font-bold text-white">{user.username}</h2>
        )}
        
        <p className="text-gray-400 text-sm mt-1">{user.email}</p>
        <span className="mt-2 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">UID: {user.id}</span>
      </div>

      <div className="bg-secondary rounded-xl border border-gray-800 p-4 space-y-4 shadow-lg">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-white">Account Details</h3>
            <button onClick={() => editMode ? handleSave() : setEditMode(true)} className="text-accent text-sm font-bold bg-green-900/20 px-3 py-1 rounded border border-green-900/50">
                {editMode ? 'Save Changes' : 'Edit Profile'}
            </button>
        </div>

        <div>
            <label className="text-xs text-gray-500 block">Phone Number</label>
            {editMode ? (
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 mt-1"/>
            ) : (
                <p className="text-white">{user.phone}</p>
            )}
        </div>
        
        {editMode && (
            <div>
                <label className="text-xs text-gray-500 block">Password</label>
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 mt-1"/>
            </div>
        )}
      </div>

      {/* Socials Section */}
      {settings && (
        <div className="bg-secondary rounded-xl border border-gray-800 p-4 shadow-lg">
             <h3 className="font-bold text-white mb-4">Follow Us</h3>
             <div className="flex justify-around">
                 {settings.socials?.facebook && (
                     <a href={settings.socials.facebook} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-blue-500 hover:scale-110 transition-transform">
                         <i className="fa-brands fa-facebook text-3xl"></i>
                         <span className="text-[10px] text-gray-400">Facebook</span>
                     </a>
                 )}
                 {settings.socials?.youtube && (
                     <a href={settings.socials.youtube} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-red-500 hover:scale-110 transition-transform">
                         <i className="fa-brands fa-youtube text-3xl"></i>
                         <span className="text-[10px] text-gray-400">YouTube</span>
                     </a>
                 )}
                 {settings.socials?.tiktok && (
                     <a href={settings.socials.tiktok} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-pink-500 hover:scale-110 transition-transform">
                         <i className="fa-brands fa-tiktok text-3xl"></i>
                         <span className="text-[10px] text-gray-400">TikTok</span>
                     </a>
                 )}
                 {settings.socials?.instagram && (
                     <a href={settings.socials.instagram} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-purple-500 hover:scale-110 transition-transform">
                         <i className="fa-brands fa-instagram text-3xl"></i>
                         <span className="text-[10px] text-gray-400">Instagram</span>
                     </a>
                 )}
             </div>
        </div>
      )}

      {settings && (
          <div className="bg-secondary rounded-xl border border-gray-800 p-4 shadow-lg">
              <h3 className="font-bold text-white mb-2">Support Care</h3>
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
                      <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div>
                      <p className="text-xs text-gray-400">Need help?</p>
                      <a href={`mailto:${settings.support_email}`} className="text-white font-bold underline decoration-dotted">{settings.support_email}</a>
                  </div>
              </div>
          </div>
      )}

      <button onClick={onLogout} className="w-full bg-red-900/20 text-red-500 border border-red-900 hover:bg-red-900/40 py-3 rounded-lg font-bold">
        Logout
      </button>
    </div>
  );
};

export default Profile;
