interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  return (
    <div className="w-96 h-full border-r border-gray-700 bg-[#1a1a1a] flex flex-col py-8 px-5 flex-shrink-0">
      <h2 className="text-xl font-semibold text-white mb-5">Thông báo</h2>

      <div className="border-t border-gray-700 mb-4" />

      <p className="text-gray-400 text-sm">Coming soon...</p>
    </div>
  );
}
