import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import { PERSON } from "@/lib/data";

export const metadata = {
  title: `Контакты — ${PERSON.name}`,
};

export default function ContactPage() {
  return (
    <main className="light">
      <section className="ct">
        <h1 className="ct-title">Контакты</h1>
        <p className="ct-label">( На связи )</p>
        <p className="ct-lead">
          Ищу позицию менеджера проектов — полная занятость, удалённо.
          Расскажите о вашей задаче, и я вернусь с ответом.
        </p>

        <span className="sticker sticker-a" aria-hidden="true">
          12+ лет
        </span>
        <span className="sticker sticker-b" aria-hidden="true">
          КО
        </span>
      </section>

      <ContactForm />
      <Footer />
    </main>
  );
}
