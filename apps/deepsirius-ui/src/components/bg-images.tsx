import Image from 'next/image';

const TopBgImage = () => (
  <Image src={'/top.svg'} alt={''} fill priority className="py-4" />
);

const BottomBgImage = () => (
  <Image src={'/bottom.svg'} alt={''} fill priority className="py-4" />
);

const FullBgImage = () => <Image src={'/full.svg'} alt={''} fill priority />;

export { TopBgImage, BottomBgImage, FullBgImage };
