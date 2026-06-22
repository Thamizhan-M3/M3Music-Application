import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, XCircle, Music } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchMetadata, setBatchMetadata] = useState({ artist: '', album: '', genre: '' });
  const fileInputRef = useRef(null);
  const token = useAuthStore(state => state.token);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    // Filter audio files
    const audioFiles = newFiles.filter(f => f.type.startsWith('audio/'));
    setFiles(prev => [...prev, ...audioFiles.map(f => ({ file: f, status: 'pending' }))]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach(f => {
      if (f.status !== 'success') {
        formData.append('files', f.file);
      }
    });

    // Add metadata overrides
    if (batchMetadata.artist) formData.append('artist', batchMetadata.artist);
    if (batchMetadata.album) formData.append('album', batchMetadata.album);
    if (batchMetadata.genre) formData.append('genre', batchMetadata.genre);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/music/upload`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201) {
          setFiles(prev => prev.map(f => ({ ...f, status: 'success' })));
          setProgress(100);
        } else {
          setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
          console.error('Upload failed', xhr.responseText);
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
        setUploading(false);
        console.error('Upload error');
      };

      xhr.send(formData);
    } catch (error) {
      console.error('Upload exception:', error);
      setUploading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto py-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight neon-text mb-4">Upload Your Music</h1>
        <p className="text-zinc-400">Our AI will automatically extract metadata and artwork for your tracks.</p>
      </div>
      
      <div 
        className={`w-full glass-card p-16 flex flex-col items-center justify-center transition-all duration-500 border-2 border-dashed ${uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-white/10 border-white/10 hover:border-primary/50'}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse shadow-[0_0_30px_rgba(29,185,84,0.1)]">
          <UploadCloud className="w-10 h-10 text-primary" />
        </div>
        <p className="text-xl font-bold mb-2">Drop your audio files here</p>
        <p className="text-sm text-zinc-500 mb-8 font-medium">Supports MP3, WAV, FLAC, M4A, OGG</p>
        <button className="btn-neon">
          Select Files
        </button>
        <input 
          type="file" 
          multiple 
          accept="audio/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
      </div>

      {files.length > 0 && !uploading && (
        <div className="mt-8 glass-card p-6 border-primary/20">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Batch Metadata (Optional)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Common Artist</label>
              <input 
                type="text" 
                placeholder="Various Artists"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-sm outline-none focus:border-primary transition-all"
                value={batchMetadata.artist}
                onChange={(e) => setBatchMetadata({...batchMetadata, artist: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Common Album</label>
              <input 
                type="text" 
                placeholder="The Greatest Hits"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-sm outline-none focus:border-primary transition-all"
                value={batchMetadata.album}
                onChange={(e) => setBatchMetadata({...batchMetadata, album: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Common Genre</label>
              <input 
                type="text" 
                placeholder="Lofi / Hip Hop"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-sm outline-none focus:border-primary transition-all"
                value={batchMetadata.genre}
                onChange={(e) => setBatchMetadata({...batchMetadata, genre: e.target.value})}
              />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 italic">Note: These values will override any metadata found inside the audio files.</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-12 space-y-6">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-2xl font-bold">Selected Queue ({files.length})</h2>
            <button 
              onClick={handleUpload}
              disabled={uploading || files.every(f => f.status === 'success')}
              className="btn-neon disabled:opacity-30 disabled:scale-100"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : 'Upload All Files'}
            </button>
          </div>

          {uploading && (
            <div className="px-4">
              <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase mb-2">
                <span>Total Progress</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300 shadow-[0_0_10px_var(--primary)]" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((fileObj, idx) => (
              <div key={idx} className="glass-card p-4 flex items-center justify-between border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fileObj.status === 'success' ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                    {fileObj.status === 'success' ? <CheckCircle className="w-5 h-5" /> : fileObj.status === 'error' ? <XCircle className="w-5 h-5 text-red-500" /> : <Music className="w-5 h-5" />}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold truncate">{fileObj.file.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">{(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                {!uploading && fileObj.status !== 'success' && (
                  <button onClick={() => removeFile(idx)} className="text-zinc-600 hover:text-red-400 p-2 transition-colors">
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
