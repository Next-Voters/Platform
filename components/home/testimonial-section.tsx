export function TestimonialSection() {
  return (
    <section className="py-20 md:py-28 bg-page">
      <div className="max-w-[760px] mx-auto px-6 text-center">
        <span
          className="block text-[72px] md:text-[96px] leading-none text-gray-200 font-serif select-none mb-4"
          aria-hidden
        >
          &ldquo;
        </span>

        <blockquote className="text-[18px] md:text-[22px] text-gray-800 leading-[1.6] font-medium italic -mt-8">
          I enjoyed my session with the Youth Civic Leaders fellows. They were knowledgeable,
          engaged and asked good questions. What I found very exciting was their geographic
          heterogeneity which brings a variety of different perspectives to their work.
        </blockquote>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSL09e96PtVn5lTnHNXYrEnsfM7BMPiV9D67g&s"
              alt="Professor Morris P. Fiorina"
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
            />
            <div className="text-left">
              <p className="text-[15px] font-semibold text-gray-900">
                Professor Morris P. Fiorina
              </p>
              <p className="text-[13.5px] text-gray-500">
                Political Science, Stanford University
              </p>
            </div>
          </div>
          <img
            src="https://logos-world.net/wp-content/uploads/2021/10/Stanford-Symbol.png"
            alt="Stanford University"
            className="h-8 w-auto opacity-50"
          />
        </div>
      </div>
    </section>
  );
}
