# Didaktik Gama – USB klávesnice (Raspberry Pi Pico jako USB host)
# Překlad:  export PICO_SDK_PATH=/cesta/k/pico-sdk ; cmake -B build ; cmake --build build
cmake_minimum_required(VERSION 3.13)

if(NOT DEFINED ENV{PICO_SDK_PATH} AND NOT DEFINED PICO_SDK_PATH)
  message(FATAL_ERROR "Nastavte PICO_SDK_PATH na adresář pico-sdk")
endif()
if(NOT DEFINED PICO_SDK_PATH)
  set(PICO_SDK_PATH $ENV{PICO_SDK_PATH})
endif()
include(${PICO_SDK_PATH}/external/pico_sdk_import.cmake)

project(gama_usb_kbd C CXX ASM)
set(CMAKE_C_STANDARD 11)
pico_sdk_init()

add_executable(gama_usb_kbd src/main.c src/keymap.c)
target_include_directories(gama_usb_kbd PRIVATE src)
target_link_libraries(gama_usb_kbd PRIVATE pico_stdlib pico_multicore tinyusb_host tinyusb_board)
pico_add_extra_outputs(gama_usb_kbd)
