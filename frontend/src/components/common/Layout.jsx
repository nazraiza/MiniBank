import Sidebar from './Sidebar';

export default function Layout({ children, title, subtitle }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {(title || subtitle) && (
          <div className="topbar">
            <div>
              {title && <h1>{title}</h1>}
              {subtitle && <div className="topbar-sub">{subtitle}</div>}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
