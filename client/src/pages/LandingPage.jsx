import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Users, Palette, Activity, CheckCircle2, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans selection:bg-primary-600/30">
      
      {/* Navigation Bar */}
      <nav className="fixed w-full top-0 z-50 backdrop-blur-md bg-white/40 dark:bg-slate-950/40 border-b border-white/20 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-900/30">
              IV
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">InvoTrack</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-sm">
            <a href="#features" className="hover:text-primary-700 dark:hover:text-primary-400 transition-colors">Features</a>
            <a href="#audience" className="hover:text-primary-700 dark:hover:text-primary-400 transition-colors">Who is this for?</a>
            <a href="#faq" className="hover:text-primary-700 dark:hover:text-primary-400 transition-colors">FAQ</a>
            <Link to="/auth" className="hover:text-primary-700 dark:hover:text-primary-400 transition-colors">Log In</Link>
            <Link to="/auth" className="bg-primary-900 hover:bg-primary-950 text-white px-5 py-2.5 rounded-full shadow-lg shadow-primary-900/20 transition-all hover:-translate-y-0.5">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100/50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 font-medium text-sm mb-8 backdrop-blur-sm border border-primary-200/50 dark:border-primary-700/50">
          <span className="flex h-2 w-2 rounded-full bg-primary-900 animate-pulse"></span>
          Now available for early access
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Automate Your Invoicing. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-primary-900 dark:from-primary-400 dark:to-primary-600">
            Control Your Inventory.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          The ultimate platform for small businesses and freelancers. 
          Seamlessly link your stock with your billing, collaborate with your team, 
          and track payments in real-time.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/auth" className="w-full sm:w-auto bg-primary-900 hover:bg-primary-950 text-white text-lg font-medium px-8 py-4 rounded-full shadow-xl shadow-primary-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
            Start for Free <ArrowRight size={20} />
          </Link>
          <a href="#features" className="w-full sm:w-auto bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-white text-lg font-medium px-8 py-4 rounded-full border border-slate-200/50 dark:border-slate-700/50 transition-all flex items-center justify-center">
            See how it works
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to run your business</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              We've combined the best of inventory management and modern invoicing into one seamless, automated experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 p-8 rounded-3xl border border-white/40 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Smart Automation</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Creating an invoice automatically deducts stock from your inventory and updates your revenue charts in real-time. No more double-entry accounting.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 p-8 rounded-3xl border border-white/40 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Team Collaboration</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate secure, 72-hour invite links for staff. Grant them specific permissions like read-only access or full inventory edit capabilities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 p-8 rounded-3xl border border-white/40 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6">
                <Palette size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Dynamic Customization</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Set custom currencies, tax rates, brand colors, and upload your company logo. Your branding applies globally across all PDFs and client-facing dashboards.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 p-8 rounded-3xl border border-white/40 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6">
                <Activity size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Real-Time Tracking</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Instantly see which invoices are Draft, Sent, Paid, or Overdue. Log partial payments and let the system automatically calculate the remaining balances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-primary-900/5 dark:bg-slate-800/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How InvoTrack Works</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get up and running in minutes. Our streamlined workflow makes managing your business effortless.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-primary-200 dark:bg-primary-900/50 -z-10"></div>
            
            <div className="text-center relative">
              <div className="w-24 h-24 mx-auto bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-3xl font-bold text-primary-900 shadow-xl shadow-primary-900/10 border-4 border-primary-100 dark:border-primary-900/30 mb-6">1</div>
              <h3 className="text-xl font-bold mb-3">Add Your Inventory</h3>
              <p className="text-slate-600 dark:text-slate-400">Input your products or services with pricing and tax rates. We'll track your stock levels automatically.</p>
            </div>
            
            <div className="text-center relative">
              <div className="w-24 h-24 mx-auto bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-3xl font-bold text-primary-900 shadow-xl shadow-primary-900/10 border-4 border-primary-100 dark:border-primary-900/30 mb-6">2</div>
              <h3 className="text-xl font-bold mb-3">Generate Invoices</h3>
              <p className="text-slate-600 dark:text-slate-400">Select items, add a client, and create a beautiful PDF invoice. Stock is deducted instantly.</p>
            </div>
            
            <div className="text-center relative">
              <div className="w-24 h-24 mx-auto bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-3xl font-bold text-primary-900 shadow-xl shadow-primary-900/10 border-4 border-primary-100 dark:border-primary-900/30 mb-6">3</div>
              <h3 className="text-xl font-bold mb-3">Get Paid Faster</h3>
              <p className="text-slate-600 dark:text-slate-400">Email invoices directly to clients and track partial or full payments from your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100/50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 font-medium text-sm mb-6 backdrop-blur-sm">
                The InvoTrack Advantage
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Why switch from your current software?</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                There are dozens of generic invoicing tools out there. We built InvoTrack differently—focusing on speed, deep inventory integration, and modern design.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400 flex-shrink-0">✓</div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">No More Silos</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Most tools separate your inventory and your billing. We married them together so your stock levels are always perfectly synced with your sales.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400 flex-shrink-0">✓</div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Built for Speed</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">We stripped out the clunky, legacy enterprise features you'll never use. Generate and send a professional PDF in under 3 clicks.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400 flex-shrink-0">✓</div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Fair, Transparent Pricing</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">We don't extort you with hidden "per-user" fees just to invite your accountant or warehouse manager. Bring the whole team.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-400 to-primary-600 rounded-[3rem] rotate-3 opacity-20 blur-2xl"></div>
              <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 dark:border-slate-700/50 shadow-2xl">
                <div className="space-y-6">
                  {/* Fake UI Element 1 */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">Old</div>
                      <div>
                        <p className="font-bold text-sm">Legacy Software</p>
                        <p className="text-xs text-slate-500">Requires 14 clicks to send an invoice</p>
                      </div>
                    </div>
                    <span className="text-red-500 font-bold">Slow</span>
                  </div>
                  
                  {/* Fake UI Element 2 */}
                  <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 flex justify-between items-center shadow-lg shadow-primary-900/5 transform scale-105">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold">IV</div>
                      <div>
                        <p className="font-bold text-sm text-primary-900 dark:text-primary-300">InvoTrack</p>
                        <p className="text-xs text-slate-500">Auto-syncs inventory on send</p>
                      </div>
                    </div>
                    <span className="text-primary-600 dark:text-primary-400 font-bold">Fast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-y border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-primary-900 dark:text-primary-400 mb-2">10k+</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Active Businesses</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-primary-900 dark:text-primary-400 mb-2">$50M</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Invoices Processed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-primary-900 dark:text-primary-400 mb-2">99.9%</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-primary-900 dark:text-primary-400 mb-2">24/7</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Expert Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section id="audience" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto backdrop-blur-2xl bg-primary-900/90 dark:bg-primary-900/80 rounded-[3rem] p-12 md:p-20 text-white text-center shadow-2xl shadow-primary-900/30 border border-primary-700/50">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Who is InvoTrack for?</h2>
          <p className="text-primary-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            Built specifically for independent professionals and growing teams who want enterprise-grade tools without the enterprise complexity.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
              <CheckCircle2 className="text-primary-300 mb-4" size={32} />
              <h4 className="font-bold text-xl mb-2">Small Businesses</h4>
              <p className="text-primary-100/80 text-sm">Track physical inventory while seamlessly generating professional invoices for your clients.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
              <CheckCircle2 className="text-primary-300 mb-4" size={32} />
              <h4 className="font-bold text-xl mb-2">Freelancers</h4>
              <p className="text-primary-100/80 text-sm">Keep your service offerings organized, send beautiful PDF invoices, and get paid faster.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
              <CheckCircle2 className="text-primary-300 mb-4" size={32} />
              <h4 className="font-bold text-xl mb-2">Agencies</h4>
              <p className="text-primary-100/80 text-sm">Manage staff permissions, track multiple payments per invoice, and monitor global revenue.</p>
            </div>
          </div>
          
          <div className="mt-12">
            <Link to="/auth" className="inline-flex items-center gap-2 bg-white text-primary-900 hover:bg-primary-50 font-bold px-8 py-4 rounded-full transition-transform hover:-translate-y-1">
              Join them today <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-white/40 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Founders Worldwide</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Don't just take our word for it. See what our users have to say.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 shadow-xl shadow-slate-200/20 dark:shadow-none border border-slate-100 dark:border-slate-800">
              <div className="flex text-yellow-400 mb-4">★★★★★</div>
              <p className="text-slate-700 dark:text-slate-300 italic mb-6">"InvoTrack completely changed how I run my consulting business. The automated PDF generation alone saves me 5 hours a week."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">SJ</div>
                <div>
                  <h4 className="font-bold">Sarah Jenkins</h4>
                  <p className="text-sm text-slate-500">Design Consultant</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 shadow-xl shadow-slate-200/20 dark:shadow-none border border-slate-100 dark:border-slate-800">
              <div className="flex text-yellow-400 mb-4">★★★★★</div>
              <p className="text-slate-700 dark:text-slate-300 italic mb-6">"Connecting inventory with invoicing is genius. I no longer have to manually check if we have enough stock before billing a client."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">MR</div>
                <div>
                  <h4 className="font-bold">Marcus Reed</h4>
                  <p className="text-sm text-slate-500">Retail Store Owner</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 shadow-xl shadow-slate-200/20 dark:shadow-none border border-slate-100 dark:border-slate-800">
              <div className="flex text-yellow-400 mb-4">★★★★★</div>
              <p className="text-slate-700 dark:text-slate-300 italic mb-6">"The ability to invite my accountant with view-only access made tax season a breeze. Highly recommend this to any agency."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">AL</div>
                <div>
                  <h4 className="font-bold">Amanda Lin</h4>
                  <p className="text-sm text-slate-500">Marketing Agency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 bg-white/30 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400">Everything you need to know about the product and billing.</p>
          </div>
          
          <div className="grid gap-6">
            {/* FAQ 1 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xl font-bold mb-3">Is it really free?</h3>
              <p className="text-slate-600 dark:text-slate-400">Yes! InvoTrack offers a generous free tier for small businesses getting started. You can manage inventory and send basic invoices without entering a credit card.</p>
            </div>
            {/* FAQ 2 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xl font-bold mb-3">Can I invite my staff?</h3>
              <p className="text-slate-600 dark:text-slate-400">Absolutely. You can generate secure, 72-hour invite links for your team members. You can also customize their permissions, such as allowing them to edit inventory or view-only access.</p>
            </div>
            {/* FAQ 3 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xl font-bold mb-3">Do my clients need an account to pay?</h3>
              <p className="text-slate-600 dark:text-slate-400">No, your clients do not need to sign up for InvoTrack. When you email them a PDF invoice, they can view the details and pay using the offline methods you specify on the invoice.</p>
            </div>
            {/* FAQ 4 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xl font-bold mb-3">Does it handle multiple currencies?</h3>
              <p className="text-slate-600 dark:text-slate-400">Yes! You can customize your company's currency symbol in the settings page. This symbol will automatically be applied to all your invoices, dashboard statistics, and PDFs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">Ready to streamline your business?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10">Join thousands of businesses managing their invoicing and inventory with InvoTrack today.</p>
          <Link to="/auth" className="inline-flex items-center gap-2 bg-primary-900 hover:bg-primary-950 text-white text-xl font-medium px-10 py-5 rounded-full shadow-2xl shadow-primary-900/30 transition-all hover:-translate-y-1">
            Get Started Free <ArrowRight size={24} />
          </Link>
          <p className="mt-6 text-sm text-slate-500">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200/20 dark:border-slate-800/50 backdrop-blur-md bg-white/20 dark:bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-900 flex items-center justify-center text-white font-bold text-sm">
              IV
            </div>
            <span className="font-bold text-slate-900 dark:text-white">InvoTrack</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © {new Date().getFullYear()} InvoTrack. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link to="/" className="hover:text-primary-700 dark:hover:text-primary-400">Privacy Policy</Link>
            <Link to="/" className="hover:text-primary-700 dark:hover:text-primary-400">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
