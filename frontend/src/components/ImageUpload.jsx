import { useDropzone } from 'react-dropzone';

export default function ImageUpload({ onFile, disabled }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    disabled,
    onDrop: (files) => files[0] && onFile(files[0]),
  });

  return (
    <div {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 select-none
        ${isDragActive
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01] shadow-glow'
          : 'border-slate-200 bg-dark-600 hover:border-blue-500/50 hover:bg-blue-500/5'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all
          ${isDragActive ? 'bg-blue-500/20 scale-110' : 'bg-slate-100 border border-slate-200'}`}>
          {isDragActive ? '📂' : '🫁'}
        </div>
        <div>
          <p className="font-semibold text-slate-700">
            {isDragActive ? 'Drop your X-ray here' : 'Drag & drop an X-ray image'}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            or <span className="text-blue-600 font-semibold">click to browse</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-dark-700 border border-slate-200 px-3 py-1.5 rounded-full">
          <span>PNG</span><span className="text-slate-700">•</span>
          <span>JPG</span><span className="text-slate-700">•</span>
          <span>Max 10 MB</span>
        </div>
      </div>
    </div>
  );
}
