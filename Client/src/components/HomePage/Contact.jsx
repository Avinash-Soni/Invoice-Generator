const Contact = () => {
  return (
    <section className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Contact Us</h1>
      <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
        Have questions? Reach out to us anytime, we’d love to help.
      </p>
      <button className="bg-[#0ea5a4] text-white font-bold px-8 py-4 rounded-full shadow-lg hover:bg-[#056b66] transition-all">
        Send Message
      </button>
    </section>
  );
};

export default Contact;
