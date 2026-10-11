import React, { useState } from 'react';
import {
  X,
  Github,
  Download,
  Terminal,
  FileCode,
  Key,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { generateAndroidProjectZip, downloadBlob } from '../services/zipExporter';
import {
  GITHUB_ACTIONS_WORKFLOW,
  RECEIVER_SERVICE_KOTLIN,
  SENDER_TASK_KOTLIN,
  ANDROID_MANIFEST_XML,
  MAIN_ACTIVITY_KOTLIN
} from '../services/nativeAndroidCode';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'instructions' | 'workflow' | 'source' | 'release'>('instructions');
  const [selectedSource, setSelectedSource] = useState<'service' | 'sender' | 'manifest' | 'activity'>('service');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const zipBlob = await generateAndroidProjectZip();
      downloadBlob(zipBlob, 'SuperShare-Android-GitHub.zip');
    } catch (err) {
      console.error('Error generating project zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                SuperShare Debug APK
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  GitHub CI/CD
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated Android Build &amp; Source Repository
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'instructions'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            GitHub Se Debug APK Kaise Le
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'workflow'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            GitHub Action CI Workflow
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'source'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Kotlin Source Code
          </button>
          <button
            onClick={() => setActiveTab('release')}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'release'
                ? 'text-emerald-400 border-emerald-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Release APK (Keystore)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {activeTab === 'instructions' && (
            <div className="space-y-5">
              {/* Top Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-emerald-600/10 border border-blue-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    SuperShare Debug APK Ready for GitHub Build
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Aapko local computer par Android Studio install karne ki zarurat nahi hai!
                    GitHub Actions cloud me automatically aapki <strong>SuperShare-debug.apk</strong> build karke download link de deta hai.
                  </p>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Step 1: Download Complete SuperShare Project ZIP
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Neeche diye gaye <strong>"Download Android Source ZIP"</strong> button par click karein. Isme saara Kotlin code, Wi-Fi Direct manager, 64KB TCP Socket Service, aur GitHub Actions workflow pehle se configure hai.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Step 2: Push to your GitHub Repository
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Apne GitHub account par ek nayi repo banayein (jaise <code className="text-blue-300 bg-slate-950 px-1 py-0.5 rounded">SuperShare</code>) aur files push karein:
                    </p>
                    <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 relative">
                      <pre className="overflow-x-auto">
{`git init
git add .
git commit -m "SuperShare initial commit with 64KB stream buffer"
git branch -M main
git remote add origin https://github.com/<YOUR_USER>/SuperShare.git
git push -u origin main`}
                      </pre>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `git init\ngit add .\ngit commit -m "SuperShare initial commit with 64KB stream buffer"\ngit branch -M main\ngit remote add origin https://github.com/<YOUR_USER>/SuperShare.git\ngit push -u origin main`,
                            'git_cmd'
                          )
                        }
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        {copiedCode === 'git_cmd' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Step 3: GitHub Actions se SuperShare Debug APK Download Karein
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Apni GitHub repo me <strong>Actions</strong> tab par jayein. Wahan <strong className="text-white">Build SuperShare Debug APK</strong> workflow automatically run ho jayega (~1-2 minute me build ho jata hai).
                      Run complete hote hi neeche <strong>Artifacts</strong> me <span className="text-emerald-400 font-mono">SuperShare-debug-apk</span> ka direct download button mil jayega!
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Step 4: Install on Android Phone
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Download ki hui zip se <code className="text-emerald-400">app-debug.apk</code> apne Android phone par transfer karke install kar lijiye aur bina internet offline Wi-Fi Direct file share karein!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    .github/workflows/build-apk.yml
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Yeh workflow GitHub par push karte hi automatic Android Debug APK build karta hai.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(GITHUB_ACTIONS_WORKFLOW, 'workflow')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
                >
                  {copiedCode === 'workflow' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy YAML</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-72 overflow-y-auto">
                <pre>{GITHUB_ACTIONS_WORKFLOW}</pre>
              </div>
            </div>
          )}

          {activeTab === 'source' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSource('service')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    selectedSource === 'service'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  SuperShareReceiverService.kt (64KB Buffer)
                </button>
                <button
                  onClick={() => setSelectedSource('sender')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    selectedSource === 'sender'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  SuperShareSender.kt
                </button>
                <button
                  onClick={() => setSelectedSource('activity')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    selectedSource === 'activity'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  MainActivity.kt
                </button>
                <button
                  onClick={() => setSelectedSource('manifest')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    selectedSource === 'manifest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  AndroidManifest.xml
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-72 overflow-y-auto">
                <pre>
                  {selectedSource === 'service' && RECEIVER_SERVICE_KOTLIN}
                  {selectedSource === 'sender' && SENDER_TASK_KOTLIN}
                  {selectedSource === 'activity' && MAIN_ACTIVITY_KOTLIN}
                  {selectedSource === 'manifest' && ANDROID_MANIFEST_XML}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'release' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <Key className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Release APK (Keystore Signing) Ready Architecture
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Jaise hi aap apna Keystore (.jks / .keystore file) provide karenge, hum release signing ke liye workflow update kar denge.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  <strong className="text-white">Jab aap keystore denge to required details:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li>
                    <strong className="text-white">Keystore File:</strong> <code className="text-emerald-400">release.keystore</code> ya <code className="text-emerald-400">super_share.jks</code> (Base64 string me GitHub Secret <code className="text-blue-300">KEYSTORE_BASE64</code> banaya jata hai).
                  </li>
                  <li>
                    <strong className="text-white">Keystore Password:</strong> (GitHub Secret: <code className="text-blue-300">KEYSTORE_PASSWORD</code>)
                  </li>
                  <li>
                    <strong className="text-white">Key Alias:</strong> (GitHub Secret: <code className="text-blue-300">KEY_ALIAS</code>)
                  </li>
                  <li>
                    <strong className="text-white">Key Password:</strong> (GitHub Secret: <code className="text-blue-300">KEY_PASSWORD</code>)
                  </li>
                </ul>

                <p className="pt-2 text-slate-400">
                  Tab GitHub Actions automatically signed <strong className="text-emerald-400">SuperShare-release.apk</strong> compile karega jise aap direct Google Play Store ya kisi bhi phone me install kar sakte hain!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Source repo includes Gradle wrapper, Kotlin files &amp; GitHub Actions CI
          </p>

          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating ZIP...' : 'Download Android Source (.ZIP)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
