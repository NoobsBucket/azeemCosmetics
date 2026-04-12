"use client";
import { useEffect, useState } from "react";
import style from "../styles/banner.module.css";

type Banner = {
  id: number;
  image_url: string;
  heading: string;
  button_text: string;
  sort_order: number;
  link_to?: string;
};

type BannerResponse = { results: Banner[] };

const headingStyles = [style.headingSide, style.headingTop, style.headingTop, style.headingTop];
const divClasses    = [style.div1, style.div3, style.div5, style.div4];

const scrollToCategory = (slug?: string) => {
  if (!slug) return;
  const el = document.getElementById(`category-${slug}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

function BannerSkeleton() {
  return (
    <div className={style.skeletonGrid}>
      <div className={style.skeletonBig}>
        <div className={style.skeletonShimmer} />
      </div>
      <div className={style.skeletonSmall}>
        <div className={style.skeletonShimmer} />
      </div>
      <div className={style.skeletonSmall}>
        <div className={style.skeletonShimmer} />
      </div>
      <div className={style.skeletonSmall}>
        <div className={style.skeletonShimmer} />
      </div>
    </div>
  );
}

export default function Banner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/banners")
      .then(r => r.json() as Promise<BannerResponse>)
      .then(d => {
        setBanners(d.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className={style.wrapper}>
      {loading ? (
        <BannerSkeleton />
      ) : (
        <div className={style.parent}>
          {banners.slice(0, 4).map((banner, i) => (
            <div key={banner.id} className={divClasses[i] || style.div4}>
              <img src={banner.image_url} alt={banner.heading} className={style.bgImage} />
              <div className={style.overlay} />
              <h2 className={`${style.heading} ${headingStyles[i] || style.headingTop}`}>
                {banner.heading.split("\n").map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                ))}
              </h2>
              <button className={style.btn} onClick={() => scrollToCategory(banner.link_to)}>
                {banner.button_text}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}