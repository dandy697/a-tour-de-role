import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👨‍👩‍👧</span>
          <h1 className="text-2xl font-bold text-orange-600">À Tour de Rôle</h1>
        </div>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Connexion
        </Link>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-block bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          🇫🇷 Conçu pour les co-parents français
        </div>
        <h2 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
          Organisez votre garde <br />
          <span className="text-orange-600">facilement</span>
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Plus de conflits d&apos;emploi du temps. Plus de confusions. Juste un planning clair,
          partagé, avec jours fériés et vacances scolaires gérés automatiquement.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Démarrer gratuitement →
          </Link>
          <a
            href="#pricing"
            className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-medium hover:border-gray-300 transition-colors"
          >
            Voir les tarifs
          </a>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: "📅",
              title: "Planning intelligent",
              desc: "Jours fériés, vacances Zone A/B/C gérés automatiquement pour 3 ans",
            },
            {
              icon: "👥",
              title: "Partagé en temps réel",
              desc: "Invitez l'autre parent et restez synchronisés sans effort",
            },
            {
              icon: "🔄",
              title: "Échanges simplifiés",
              desc: "Proposez des échanges de week-end et obtenez une réponse rapide",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-3">Tarifs simples</h2>
          <p className="text-gray-500 text-center mb-12">
            Commencez gratuitement, passez au Pro quand vous en avez besoin.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="border-2 border-gray-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-1">Gratuit</h3>
              <p className="text-3xl font-bold mb-1">
                €0<span className="text-base text-gray-400 font-normal">/mois</span>
              </p>
              <p className="text-gray-500 text-sm mb-6">Pour toujours</p>
              <ul className="space-y-3 mb-8 text-sm">
                {["1 famille", "Planning 3 ans", "Jours fériés inclus", "Notifications"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full text-center border-2 border-gray-200 py-2.5 rounded-xl font-medium hover:border-gray-300 transition-colors"
              >
                Commencer
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-blue-600 rounded-2xl p-8 bg-blue-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAIRE
              </div>
              <h3 className="text-xl font-bold mb-1">Pro</h3>
              <p className="text-3xl font-bold mb-1">
                €4.99<span className="text-base text-gray-400 font-normal">/mois</span>
              </p>
              <p className="text-gray-500 text-sm mb-6">Annulable à tout moment</p>
              <ul className="space-y-3 mb-8 text-sm">
                {["3 familles", "Chat & commentaires", "Échanges de week-ends", "Support prioritaire"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Essayer Pro
              </Link>
            </div>

            {/* Premium */}
            <div className="border-2 border-gray-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-1">Premium</h3>
              <p className="text-3xl font-bold mb-1">
                €9.99<span className="text-base text-gray-400 font-normal">/mois</span>
              </p>
              <p className="text-gray-500 text-sm mb-6">Tout inclus</p>
              <ul className="space-y-3 mb-8 text-sm">
                {["Familles illimitées", "Analytics avancées", "Accès API", "Support dédié"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full text-center border-2 border-blue-600 text-blue-600 py-2.5 rounded-xl font-medium hover:bg-blue-50 transition-colors"
              >
                Essayer Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>
            © 2026 À Tour de Rôle ·{" "}
            <a href="mailto:hello@atourderole.tk" className="hover:text-gray-700">
              hello@atourderole.tk
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
