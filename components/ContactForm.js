"use client";

// Layout only: submitting is not connected anywhere yet (see TODO.md).
export default function ContactForm() {
  return (
    <form className="cf" onSubmit={(e) => e.preventDefault()}>
      <label className="cf-row">
        <span>Имя</span>
        <input name="name" placeholder="Ваше имя" autoComplete="name" />
      </label>
      <label className="cf-row">
        <span>Компания</span>
        <input name="company" placeholder="Название компании" autoComplete="organization" />
      </label>
      <label className="cf-row">
        <span>Email</span>
        <input name="email" type="email" placeholder="you@email.ru" autoComplete="email" />
      </label>
      <label className="cf-row">
        <span>Формат</span>
        <select name="format" defaultValue="">
          <option value="" disabled>
            Выберите…
          </option>
          <option>Полная занятость</option>
          <option>Проектная работа</option>
          <option>Консультация</option>
          <option>Другое</option>
        </select>
      </label>
      <label className="cf-row">
        <span>Сообщение</span>
        <textarea name="message" rows={3} placeholder="Расскажите о задаче" />
      </label>
      <div className="cf-foot">
        <label className="cf-check">
          <input type="checkbox" name="agree" />
          <span>Я согласен(на) с политикой конфиденциальности</span>
        </label>
        <button type="submit" className="cf-submit">
          <i /> Отправить
        </button>
      </div>
    </form>
  );
}
