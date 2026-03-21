import PetLoading from '../components/PetLoading';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <PetLoading message="Pati dünyası yükleniyor..." />
        </div>
    );
}
