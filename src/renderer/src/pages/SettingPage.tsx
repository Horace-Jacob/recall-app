import React from 'react';
import {
  User,
  ChevronRight,
  ArrowLeft,
  DownloadCloud,
  ExternalLink,
  Puzzle,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@renderer/context/AuthContext';
import { Loading } from '@renderer/components/Loading';

const SettingsPage: React.FC = () => {
  const { session, loading } = useAuth();

  const checkForUpdates = (): void => {
    // Implement update check logic here
    window.electronAPI.update.checkForUpdates();
  };

  const openFeedbackForm = (): void => {
    // Implement feedback form logic here
    window.open('https://forms.gle/XSqBeRTQ6GkVYXVv5', '_blank');
  };

  return (
    <>
      {loading && !session ? (
        <Loading IsOpen={loading} />
      ) : (
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="border-b border-border">
            <div className="flex items-center max-w-4xl mx-auto px-6 py-4">
              <Link
                to="/"
                className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Link>
              <h1 className="text-2xl font-semibold text-foreground ml-1">Settings</h1>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto px-6 py-8">
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Help
              </h2>

              <div
                className="bg-background border border-border rounded-lg hover:bg-secondary transition-colors"
                onClick={() => {
                  openFeedbackForm();
                }}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Feedback</p>
                      {/*<p className="text-sm text-secondary-foreground">support@yourapp.com</p>*/}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </section>
            {/* Account Section */}
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Account
              </h2>

              <div className="bg-background border border-border rounded-lg hover:bg-secondary transition-colors">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Email</p>
                      <p className="text-sm text-secondary-foreground">{session!.user.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Browser Extension
              </h2>

              <div className="bg-background border border-border rounded-lg hover:bg-secondary transition-colors">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Puzzle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Chrome Extension</p>
                      <p className="text-sm text-secondary-foreground">
                        Save pages with one click while browsing
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://chromewebstore.google.com/detail/memory-layer/jkoekcdligppajejbhfofemcjnbhljik"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Install
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </section>

            {/*<section className="mb-10">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Appearance
              </h2>

              <div className="flex items-center justify-between bg-background p-4 border border-border rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-foreground ">Theme</p>
                  <p className="text-sm text-foreground">Choose your preferred color scheme</p>
                </div>
                <ThemeToggle />
              </div>
            </section>*/}

            {/* Support Section */}
            <section className="mt-10">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Update
              </h2>

              <div
                className="bg-background border border-border rounded-lg hover:bg-secondary transition-colors"
                onClick={() => {
                  checkForUpdates();
                }}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <DownloadCloud className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Check For Updates</p>
                      {/*<p className="text-sm text-secondary-foreground">support@yourapp.com</p>*/}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPage;
