import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-5xl md:text-7xl font-extrabold mb-6 tracking-wide"
      >
        Invoicing Made Simple
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="text-lg md:text-2xl text-white/90 max-w-2xl mb-8"
      >
        Create and manage invoices effortlessly with our intuitive tools.
      </motion.p>
      <motion.button
        whileHover={{ scale: 1.15, rotate: 2 }}
        whileTap={{ scale: 0.9 }}
        className="bg-[#0ea5a4] text-white font-bold px-8 py-4 rounded-full shadow-lg hover:bg-[#056b66] transition-all"
      >
        Get Started
      </motion.button>
    </section>
  );
};

export default Hero;
