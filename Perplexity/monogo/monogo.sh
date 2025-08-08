#!/bin/bash

# test shell-commands
test_shell_command() {

    # echo "함수 파라메타 \$@ : $@"
    # echo "함수 파라메타 0 : $0 : 스크립트명"
    # echo "함수 파라메타 1 : $1"
    # echo "함수 파라메타 2 : $2"

    script_name="$0"
    echo "전체 경로 포함 스크립트명: $script_name"

    file_name=$(basename "$script_name")
    echo "스크립트 파일명: $file_name"

    # 파일명에서 확장자 제거
    name_without_extension="${file_name%.*}"
    echo "파일명 (확장자 제거): $name_without_extension"  # 출력: my_script

    # 확장자만 추출
    extension="${file_name##*.}"
    echo "확장자: $extension"  # 출력: sh

    # exit;
}

# git switch develop && git pull && git switch main && git merge develop

# MonoGo 개발/테스트/운영 스크립트

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리 (스크립트가 어디서 실행되든 항상 프로젝트 루트로 이동)
SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_ROOT="$SCRIPT_DIR"

# 함수 정의

# Get 프로젝트명
get_project_name() {

    # 스크립트 파일명
    local script_name="$0"
    local file_name=$(basename "$script_name")
    # 파일명에서 확장자 제거
    local name_without_extension="${file_name%.*}"
    # 확장자만 추출
    # local extension="${file_name##*.}"

    echo ${name_without_extension}
}

# 서비스 빌드 및 재시작
build_and_restart() {
    local env=${1:-development} # 기본값 development
    echo -e "${YELLOW}>>> Docker Compose 서비스 빌드 및 재시작 (환경: $env)...${NC}"
    cd "$PROJECT_ROOT" || exit 1
    APP_ENV=$env docker compose up -d --build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}>>> 서비스 빌드 및 재시작 완료.${NC}"
    else
        echo -e "${RED}>>> 서비스 빌드 및 재시작 실패.${NC}"
        exit 1
    fi
}

# 특정 서비스 빌드 및 재시작
build_and_restart_service() {
    local project_name=$(get_project_name)
    local service_name="${project_name}-${1:-frontend}" # 기본값 frontend
    local env=${2:-development} # 기본값 development
    echo -e "${YELLOW}>>> Docker Compose 서비스 빌드 및 재시작 (환경: $env)...${NC}"
    cd "$PROJECT_ROOT" || exit 1
    APP_ENV=$env docker compose up -d --build "${service_name}"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}>>> 서비스 빌드 및 재시작 완료.${NC}"
    else
        echo -e "${RED}>>> 서비스 빌드 및 재시작 실패.${NC}"
        exit 1
    fi
}

# Docker 환경 정리
clean_env() {
    echo -e "${RED}>>> 경고: 이 작업은 모든 Docker 컨테이너, 네트워크, 볼륨을 영구적으로 삭제합니다.${NC}"
    echo -e "${RED}>>> 데이터베이스 데이터도 삭제되므로 주의하십시오.${NC}"
    read -p "정말 진행하시겠습니까? (y/N): " confirm
    if [[ "$confirm" == [yY] || "$confirm" == [yY][eE][sS] ]]; then
        echo -e "${YELLOW}>>> Docker 환경 정리 중...${NC}"
        cd "$PROJECT_ROOT" || exit 1
        docker compose down --volumes --remove-orphans
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}>>> Docker 환경 정리 완료.${NC}"
        else
            echo -e "${RED}>>> Docker 환경 정리 실패.${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}>>> Docker 환경 정리 취소.${NC}"
    fi
}

# 도움말 표시
show_help() {
    echo "사용법: ./$0 [명령어]"
    echo ""
    echo "명령어:"
    echo "  build       : Docker Compose 서비스를 빌드하고 재시작합니다."
    echo "  clean       : 모든 Docker 컨테이너, 네트워크, 볼륨을 삭제합니다. (경고: 데이터 손실 가능)"
    echo "  help        : 이 도움말 메시지를 표시합니다."
    echo ""
    echo "예시:"
    echo "  ./$0 build"
    echo "  ./$0 clean"
}

# 메인 로직
main() {
    case "$1" in
        build)
            shift 
            build_and_restart "$@" # 환경 인자 전달
            ;;
        service)
            shift 
            build_and_restart_service "$@" # 환경 인자 전달
            ;;
        clean)
            clean_env
            ;;
        help)
            show_help
            ;;
        test-shell)
            shift 
            test_shell_command "$@"
            ;;
        *)
            echo -e "${RED}오류: 알 수 없는 명령어입니다. 'help'를 입력하여 사용법을 확인하세요.${NC}"
            show_help
            exit 1
            ;;
    esac
    echo -e "${GREEN}>>> 작업이 완료되었습니다.${NC}" 
}

# 메인 함수 호출
main "$@"
