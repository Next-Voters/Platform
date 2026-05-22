const stats = [
  {
    number: "87%",
    text: "believe disinformation has harmed political life in their country",
    cite: "UNESCO-Ipsos",
  },
  {
    number: "4%",
    text: "of young adults passed a basic four-question civics test",
    cite: "Citizens & Scholars",
  },
  {
    number: "48%",
    text: "of young adults plan to vote, vs. 66% of the general public",
    cite: "Citizens & Scholars",
  },
  {
    number: "56%",
    text: "of internet users get news from social media, not from official sources",
    cite: "Ipsos",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-gray-950 py-20 md:py-28">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="max-w-[600px] mb-12 md:mb-16">
          <p className="text-[11px] tracking-[0.14em] uppercase text-gray-500 font-semibold mb-4">
            The problem
          </p>
          <h2 className="text-[28px] md:text-[38px] font-bold text-white tracking-tight leading-[1.12]">
            The civic information crisis is real.
          </h2>
          <p className="mt-4 text-[15px] md:text-[17px] text-gray-400 leading-relaxed">
            A generation is making decisions based on social media clips instead of
            official government records. The data is clear.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((s) => (
            <div
              key={s.number}
              className="rounded-xl p-6 bg-white/[0.04] border border-white/[0.08]"
            >
              <div className="text-[48px] md:text-[56px] font-bold text-white leading-none mb-3">
                {s.number}
              </div>
              <p className="text-[14.5px] text-gray-400 leading-relaxed">
                {s.text}
              </p>
              <p className="mt-2 text-[11.5px] text-gray-600">
                {s.cite}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
