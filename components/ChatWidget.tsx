import { useEffect } from 'react';

export const ChatWidget = () => {
  useEffect(() => {
    // Inject WidgetBot script
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/@widgetbot/crate@3';
    script1.async = true;
    script1.defer = true;
    document.body.appendChild(script1);

    script1.onload = () => {
      // Check if Crate is defined on window, initialize if so
      if (window && (window as any).Crate) {
        (window as any).crateInstance = new (window as any).Crate({
            server: '1450136714600382496',
            channel: '1491521827888173107',
            location: 'bottom-right'
        });
      }
    };

    return () => {
      // Clean up scripts if functionality needs to be removed
      if (document.body.contains(script1)) {
        document.body.removeChild(script1);
      }
    };
  }, []);

  return null;
};
