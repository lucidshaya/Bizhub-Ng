import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Send, Rocket, Building2, Mail, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function WaitlistPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        industry: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
            await axios.post(`${apiUrl}/waitlist`, formData);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error joining waitlist:', error);
            // Fallback for demo if backend is not running
            setIsSubmitted(true);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="min-h-screen bg-cream font-sans text-gray-900 selection:bg-gold selection:text-primary">
            <Navbar />

            <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-primary font-bold mb-8 hover:gap-3 transition-all group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
                            <Rocket size={16} /> Ready to launch soon
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
                        >
                            The Future of <span className="text-primary italic">Nigerian</span> Business Starts Here.
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-lg text-gray-700 mb-8 max-w-md"
                        >
                            Join 500+ forward-thinking founders who are waiting to transform how they manage their operations and payroll.
                        </motion.p>

                        <motion.div variants={itemVariants} className="space-y-4">
                            {[
                                "Priority access to early bird pricing",
                                "Exclusive invitation to private beta",
                                "Direct line to our founding team",
                                "Free business growth resources"
                            ].map((perk, i) => (
                                <div key={i} className="flex items-center gap-3 font-medium text-gray-800">
                                    <div className="bg-primary text-white p-1 rounded-full">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    {perk}
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border-4 border-white/20 relative overflow-hidden"
                    >
                        {isSubmitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h2 className="text-3xl font-bold mb-4">You're on the list!</h2>
                                <p className="text-gray-600 mb-8 max-w-xs mx-auto">
                                    We'll notify you as soon as we open the doors. Buckle up, it's going to be a wild ride.
                                </p>
                                <Link
                                    to="/"
                                    className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-darkGreen transition-colors inline-block"
                                >
                                    Return Home
                                </Link>
                            </motion.div>
                        ) : (
                            <>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                    <Send className="text-primary" /> Join the waitlist
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <Building2 size={16} className="text-gray-400" /> Business Name
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g. LucidGravity Tech"
                                            className="w-full bg-cream/50 border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-4 px-6 outline-none transition-all font-medium"
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <Mail size={16} className="text-gray-400" /> Email Address
                                        </label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="you@company.ng"
                                            className="w-full bg-cream/50 border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-4 px-6 outline-none transition-all font-medium"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <Briefcase size={16} className="text-gray-400" /> Industry
                                        </label>
                                        <select
                                            required
                                            className="w-full bg-cream/50 border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-4 px-6 outline-none transition-all font-medium appearance-none"
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        >
                                            <option value="">Select industry...</option>
                                            <option value="retail">Retail & Commerce</option>
                                            <option value="tech">Technology & SaaS</option>
                                            <option value="finance">Fintech & Finance</option>
                                            <option value="logistics">Logistics & Supply Chain</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-darkGreen text-gold font-bold py-5 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 text-lg"
                                    >
                                        Hold my spot <ArrowRight size={20} />
                                    </button>

                                    <p className="text-center text-xs text-gray-500 font-medium">
                                        No spam. Just big updates for big businesses.
                                    </p>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
