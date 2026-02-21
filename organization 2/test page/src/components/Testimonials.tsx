import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
const testimonials = [
{
  id: 1,
  name: 'Chioma A.',
  role: 'CEO, Chioma Fabrics',
  location: 'Lagos',
  image:
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  quote:
  'Before BizHub NG, I was managing 12 staff on Excel. Now I process payroll in 5 minutes. E don change my life!',
  color: 'bg-primary'
},
{
  id: 2,
  name: 'Emeka O.',
  role: 'Director, TechSolutions',
  location: 'Abuja',
  image:
  'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  quote:
  'My accountant said I was the most organized client he had ever seen. Na BizHub NG do am.',
  color: 'bg-darkGreen'
},
{
  id: 3,
  name: 'Fatima B.',
  role: 'Owner, Northern Spices',
  location: 'Kano',
  image:
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  quote:
  "I track inventory across 3 shops from my phone. My competitors don't know my secret weapon.",
  color: 'bg-coral'
}];

export function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 inline-block relative">
            What Our Users Say
            <div className="absolute bottom-1 left-0 w-full h-3 bg-gold/40 -z-10 transform -rotate-1"></div>
          </h2>
          <p className="text-lg text-gray-600 mt-4">
            Don't just take our word for it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) =>
          <motion.div
            key={testimonial.id}
            initial={{
              opacity: 0,
              y: 30
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              duration: 0.5,
              delay: index * 0.2
            }}
            whileHover={{
              y: -10
            }}
            className="bg-cream rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col h-full relative">

              <Quote className="absolute top-6 right-6 text-gold opacity-40 w-12 h-12" />

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold p-1">
                  <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-full h-full object-cover rounded-full" />

                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                  <p className="text-xs font-semibold text-primary">
                    {testimonial.location}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 text-lg font-medium italic leading-relaxed flex-grow">
                "{testimonial.quote}"
              </p>

              <div className="mt-6 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) =>
              <svg
                key={star}
                className="w-5 h-5 text-gold fill-current"
                viewBox="0 0 20 20">

                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
              )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}