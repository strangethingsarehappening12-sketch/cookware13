interface GalleryImage {
  src: string
  alt: string
}

const GALLERY_IMAGES: GalleryImage[] = [
  { src: '/gallery/cookware-ad-heirloom.jpg', alt: '$COOKWARE — The Family Heirloom, On-Chain' },
  { src: '/gallery/tightrope-balance.jpg', alt: 'Balancing two pots of COOKWARE on a tightrope' },
  { src: '/gallery/crying-cat.jpg', alt: 'Crying cat meme hugging a pot of COOKWARE coins' },
  { src: '/gallery/giant-hand-robinhood.jpg', alt: 'A giant hand lowering the pot to a hooded figure' },
  { src: '/gallery/artisan-workshop.jpg', alt: 'An artisan forging the COOKWARE pot by hand' },
  { src: '/gallery/moon-tree-glow.jpg', alt: 'The pot glowing like a moon over a forest cabin' },
  { src: '/gallery/subway-hood.jpg', alt: 'Carrying the $HOOD payout home on the train' },
  { src: '/gallery/stone-statue.jpg', alt: 'An ancient stone monument shaped like the pot' },
  { src: '/gallery/chef-kitchen.jpg', alt: 'A busy kitchen with the COOKWARE pot on the counter' },
  { src: '/gallery/spotlight-robinhood.jpg', alt: 'A hooded figure under the COOKWARE signal' },
  { src: '/gallery/sunset-reflection.jpg', alt: 'The pot glowing at sunset with its reflection' },
  { src: '/gallery/bear-shadow.jpg', alt: 'A shadow puppet bear holding a tiny pot' },
  { src: '/gallery/parchment-sketch.jpg', alt: 'An old parchment sketch of the pot of coins' },
]

// A fixed rotation per slot keeps the "pinned to a corkboard" feel without
// the layout jittering between renders.
const ROTATIONS = ['-rotate-2', 'rotate-1', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3']

export default function MemeGallery() {
  return (
    <div className="columns-2 gap-5 sm:columns-3 lg:columns-4 [&>*]:mb-5">
      {GALLERY_IMAGES.map((img, i) => (
        <div
          key={img.src}
          className={`break-inside-avoid rounded-2xl border-[3px] border-ink bg-cream p-2 shadow-thick transition-transform duration-200 hover:rotate-0 hover:-translate-y-1 ${
            ROTATIONS[i % ROTATIONS.length]
          }`}
        >
          <img
            src={img.src}
            alt={img.alt}
            loading="lazy"
            className="w-full rounded-xl object-cover"
          />
        </div>
      ))}
    </div>
  )
}
