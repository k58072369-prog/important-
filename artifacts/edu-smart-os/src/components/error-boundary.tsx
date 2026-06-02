import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack?: string;
  retryCount: number;
}

const errorLog: Array<{ time: string; message: string; section?: string }> = [];

export function getErrorLog() {
  return [...errorLog];
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "", retryCount: 0 };
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const message =
      error instanceof Error ? error.message
      : typeof error === "string" ? error
      : "حدث خطأ غير متوقع";
    const stack = error instanceof Error ? error.stack : undefined;
    return { hasError: true, errorMessage: message, errorStack: stack };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    const message = error instanceof Error ? error.message : String(error);
    const entry = {
      time: new Date().toLocaleTimeString("ar-EG"),
      message,
      section: this.props.section,
      stack: info.componentStack,
    };
    errorLog.push(entry);
    if (errorLog.length > 50) errorLog.shift();

    // Try to persist error log
    try {
      const existing = JSON.parse(localStorage.getItem("furqan_error_log") ?? "[]");
      existing.push(entry);
      if (existing.length > 100) existing.splice(0, existing.length - 100);
      localStorage.setItem("furqan_error_log", JSON.stringify(existing));
    } catch {}
  }

  handleReset = () => {
    this.setState(s => ({ hasError: false, errorMessage: "", errorStack: undefined, retryCount: s.retryCount + 1 }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isSection = !!this.props.section;

      if (isSection) {
        return (
          <div dir="rtl" className="flex flex-col items-center justify-center p-8 rounded-2xl border border-destructive/30 bg-destructive/5 min-h-[200px] text-center gap-4">
            <Bug className="h-10 w-10 text-destructive/60" />
            <div>
              <p className="font-semibold text-destructive">خطأ في قسم {this.props.section}</p>
              <p className="text-sm text-muted-foreground mt-1 font-mono">{this.state.errorMessage}</p>
            </div>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة تحميل القسم
            </button>
          </div>
        );
      }

      return (
        <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary">حدث خطأ في التطبيق</h1>
              <p className="text-muted-foreground text-sm mt-2">{this.state.errorMessage}</p>
            </div>
            {this.state.errorStack && (
              <details className="text-left bg-muted/50 rounded-lg p-3 cursor-pointer">
                <summary className="text-xs text-muted-foreground">تفاصيل تقنية</summary>
                <pre className="text-xs mt-2 overflow-auto max-h-32 text-muted-foreground whitespace-pre-wrap">{this.state.errorStack.slice(0, 500)}</pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
                {this.state.retryCount > 0 && <span className="text-xs opacity-70">({this.state.retryCount})</span>}
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-muted text-secondary rounded-xl hover:bg-muted/80 transition-colors font-medium flex items-center gap-2 text-sm"
              >
                <Home className="h-4 w-4" />
                إعادة تحميل الصفحة
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              البيانات محفوظة بأمان في قاعدة البيانات المحلية ولن تُفقد.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
