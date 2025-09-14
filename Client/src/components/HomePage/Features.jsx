import { motion } from "framer-motion";
import Cards from "./Cards";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const Features = () => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-6 py-12 flex justify-center"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
        <Cards />
      </div>
    </motion.section>
  );
};

export default Features;
