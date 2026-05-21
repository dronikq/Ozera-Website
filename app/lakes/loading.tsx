export default function Loading() {
  return (
    <div className="dk-page dk-catalog-page">
      <main className="dk-catalog-main">
        <section className="dk-catalog-hero">
          <div className="dk-container">
            <div className="dk-skeleton dk-skeleton--hero">
              <div className="dk-skeleton__badge" />
              <div className="dk-skeleton__title" />
              <div className="dk-skeleton__subtitle" />
            </div>
          </div>
        </section>

        <section className="dk-catalog-section">
          <div className="dk-container">
            <div className="dk-skeleton dk-skeleton--filters">
              <div className="dk-skeleton__search" />
              <div className="dk-skeleton__chips">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="dk-skeleton__chips dk-skeleton__chips--wide">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </section>

        <section className="dk-catalog-section">
          <div className="dk-container">
            <div className="dk-skeleton dk-skeleton--promo" />
          </div>
        </section>

        <section className="dk-catalog-section">
          <div className="dk-container">
            <div className="dk-skeleton-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="dk-lake-skeleton oz-card">
                  <div className="dk-lake-skeleton__media" />
                  <div className="dk-lake-skeleton__body">
                    <div className="dk-lake-skeleton__line dk-lake-skeleton__line--title" />
                    <div className="dk-lake-skeleton__line dk-lake-skeleton__line--location" />
                    <div className="dk-lake-skeleton__chips">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="dk-lake-skeleton__footer">
                      <div className="dk-lake-skeleton__line dk-lake-skeleton__line--price" />
                      <div className="dk-lake-skeleton__button" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
