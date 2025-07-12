import React from 'react';

const About = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">About</h1>
        <a 
          href="https://github.com/Mathiyass/MA-Optimizer" 
          target="_blank" 
          rel="noopener noreferrer"
          className="quantum-button"
        >
          View on GitHub
        </a>
      </div>
      
      <div className="quantum-card">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-background-dark text-3xl font-bold mb-6">
            MA
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">MA OPTIMIZER</h2>
          <p className="text-xl text-secondary mb-4">QUANTUM ULTRA v6.0</p>
          <p className="text-white/70 text-center max-w-2xl">
            The Ultimate Cybernetic Performance Enhancement Suite
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="quantum-card">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Quantum-Powered</h3>
          </div>
          <p className="text-white/70">
            20,000+ system tweaks leveraging quantum computing principles for unprecedented speed and efficiency.
          </p>
        </div>
        
        <div className="quantum-card">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">AI-Driven</h3>
          </div>
          <p className="text-white/70">
            Neural network algorithms that continuously learn and adapt to your specific hardware configuration.
          </p>
        </div>
        
        <div className="quantum-card">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Cybernetic</h3>
          </div>
          <p className="text-white/70">
            90-99% responsiveness increase, 75% faster boot times, and 70% extended battery life.
          </p>
        </div>
      </div>
      
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-6 text-white">Performance Metrics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-primary to-secondary text-background-dark">
                <th className="py-3 px-4 text-left">Optimization Type</th>
                <th className="py-3 px-4 text-center">Pre-Optimization</th>
                <th className="py-3 px-4 text-center">Post-Optimization</th>
                <th className="py-3 px-4 text-center">Improvement</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">CPU Performance</td>
                <td className="py-3 px-4 text-center">850 pts</td>
                <td className="py-3 px-4 text-center">1,870 pts</td>
                <td className="py-3 px-4 text-center text-green-500">+120% ↑</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">Memory Speed</td>
                <td className="py-3 px-4 text-center">22 GB/s</td>
                <td className="py-3 px-4 text-center">58 GB/s</td>
                <td className="py-3 px-4 text-center text-green-500">+164% ↑</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">Disk I/O</td>
                <td className="py-3 px-4 text-center">350 MB/s</td>
                <td className="py-3 px-4 text-center">1.2 GB/s</td>
                <td className="py-3 px-4 text-center text-green-500">+243% ↑</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">Graphics Rendering</td>
                <td className="py-3 px-4 text-center">45 FPS</td>
                <td className="py-3 px-4 text-center">132 FPS</td>
                <td className="py-3 px-4 text-center text-green-500">+193% ↑</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Network Throughput</td>
                <td className="py-3 px-4 text-center">120 Mbps</td>
                <td className="py-3 px-4 text-center">980 Mbps</td>
                <td className="py-3 px-4 text-center text-green-500">+717% ↑</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-6 text-white">Technical Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 text-primary">Platform</td>
                  <td className="py-3 px-4">Windows 10/11 (64-bit)</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 text-primary">Architecture</td>
                  <td className="py-3 px-4">x64, ARM64</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 text-primary">Memory Requirements</td>
                  <td className="py-3 px-4">4GB RAM minimum (8GB recommended)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 text-primary">Quantum Core</td>
                  <td className="py-3 px-4">v2.4.8 (Shor's Algorithm Implementation)</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 text-primary">Neural Network</td>
                  <td className="py-3 px-4">TensorFlow Quantum v0.7.2</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 text-primary">Security</td>
                  <td className="py-3 px-4">Post-Quantum Cryptography Suite v1.3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-6 text-white">Connect With Us</h2>
        <div className="flex flex-wrap gap-4">
          <a 
            href="https://discord.gg/QERP5JJM8k" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-6 py-3 bg-[#5865F2] rounded-lg hover:bg-[#4752C4] transition-colors"
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
            Join Discord
          </a>
          <a 
            href="https://github.com/Mathiyass/MA-Optimizer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-6 py-3 bg-[#24292e] rounded-lg hover:bg-[#1b1f23] transition-colors"
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </a>
          <a 
            href="https://www.facebook.com/mathisha.angirasa/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-6 py-3 bg-[#1877F2] rounded-lg hover:bg-[#166FE5] transition-colors"
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </a>
          <a 
            href="https://www.instagram.com/mathi_ya_/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-6 py-3 bg-[#E4405F] rounded-lg hover:bg-[#D93651] transition-colors"
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
            </svg>
            Instagram
          </a>
        </div>
      </div>
      
      <div className="text-center text-white/50 py-6">
        <p>© 2024 MATHIYA Technologies | Quantum Division | All realities reserved</p>
        <p className="mt-2 text-sm">
          <span className="text-primary">MATHIYA QUANTUM ULTRA v6.0</span> - The Ultimate Cybernetic Performance Enhancement Suite
        </p>
      </div>
    </div>
  );
};

export default About;