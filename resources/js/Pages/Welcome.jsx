import { Head, Link } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";

export default function Welcome() {
    return (
        <>
            <Head title="Welcome to #yourBestOPtion" />

            <PageTheme>
                <div className="flex items-center justify-center h-screen">
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        loop={true}
                        navigation={true}
                        pagination={{ type: "progressbar" }}
                        autoplay={{ disableOnInteraction: true }}
                    >
                        <SwiperSlide>
                            <div className="relative">
        <img 
            src="https://img.freepik.com/premium-photo/abstract-dark-blue-background-silk-satin-navy-blue-color-elegant-background-with-space-design-soft-wavy-folds_728202-5520.jpg?w=360" 
            alt="Slide 1" 
            className="w-full h-screen object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h2 className="text-4xl font-bold">Your Headline Here</h2>
            <p className="text-lg mt-4">Your subtext here</p>
        </div>
    </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="relative">
        <img 
            src="https://cdn.wallpapersafari.com/10/34/xwEKsq.jpg" 
            alt="Slide 1" 
            className="w-full h-screen object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h2 className="text-4xl font-bold">Your Headline Here</h2>
            <p className="text-lg mt-4">Your subtext here</p>
        </div>
    </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="relative">
        <img 
            src="https://media.istockphoto.com/id/1807779771/vector/abstract-dark-blue-vector-background.jpg?s=612x612&w=0&k=20&c=7iEsr6VR1PwHxzQyZVUAJw9cSGPtWOcRjyXBkbH6mCI=" 
            alt="Slide 1" 
            className="w-full h-screen object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h2 className="text-4xl font-bold">Your Headline Here</h2>
            <p className="text-lg mt-4">Your subtext here</p>
        </div>
    </div>
                        </SwiperSlide>
                    </Swiper>
                </div>
            </PageTheme>
        </>
    );
}
