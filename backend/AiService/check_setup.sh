#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}TumorXtract Setup Verification${NC}"
echo "================================"

# Check Python version
echo -n "Checking Python version... "
if command -v python3 &>/dev/null; then
    python_version=$(python3 --version)
    if [[ $python_version =~ "Python 3" ]]; then
        echo -e "${GREEN}OK${NC} ($python_version)"
    else
        echo -e "${RED}Error: Python 3 required${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: Python 3 not found${NC}"
    exit 1
fi

# Check pip
echo -n "Checking pip installation... "
if command -v pip &>/dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}Error: pip not found${NC}"
    exit 1
fi

# Check virtual environment
echo -n "Checking virtual environment... "
if [[ -d "venv" ]]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}Warning: Virtual environment not found${NC}"
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Could not activate virtual environment${NC}"
    exit 1
fi

# Check requirements
echo -n "Checking requirements... "
if [ -f "backend/requirements.txt" ]; then
    echo -e "${GREEN}OK${NC}"
    echo "Installing requirements..."
    pip install -r backend/requirements.txt
else
    echo -e "${RED}Error: requirements.txt not found${NC}"
    exit 1
fi

# Check model files
echo "Checking model files..."
model_files=(
    "backend/model/EfficientNet_model_Brain_Detection.h5"
    "backend/model/Model_Segmentation.h5"
)

for file in "${model_files[@]}"; do
    echo -n "  Checking $file... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}Not found${NC}"
        echo "Please ensure model files are in the correct location"
        exit 1
    fi
done

# Check directories
echo "Checking directory structure..."
directories=(
    "frontend"
    "backend"
    "backend/logs"
    "backend/uploads"
)

for dir in "${directories[@]}"; do
    echo -n "  Checking $dir... "
    if [ -d "$dir" ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}Creating...${NC}"
        mkdir -p "$dir"
    fi
done

# Check ports
echo "Checking ports..."
for port in 5000 8000; do
    echo -n "  Checking port $port... "
    if command -v netstat &>/dev/null; then
        if netstat -an | grep ":$port " | grep "LISTEN" >/dev/null; then
            echo -e "${YELLOW}In use${NC}"
        else
            echo -e "${GREEN}Available${NC}"
        fi
    else
        echo -e "${YELLOW}Cannot check (netstat not available)${NC}"
    fi
done

# Run test suite
echo "Running tests..."
cd backend
if python test_model.py; then
    echo -e "${GREEN}All tests passed${NC}"
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi
cd ..

echo -e "\n${GREEN}Setup verification complete!${NC}"
echo "You can now run the application with: python run.py"

# Print system info
echo -e "\nSystem Information:"
echo "-------------------"
echo "Python: $(python3 --version)"
echo "Pip: $(pip --version)"
echo "OS: $(uname -a)"
if command -v nvidia-smi &>/dev/null; then
    echo "GPU: Available ($(nvidia-smi --query-gpu=name --format=csv,noheader))"
else
    echo "GPU: Not detected"
fi

echo -e "\n${YELLOW}Note:${NC} If you encounter any issues, please check the documentation:"
echo "- README.md for general guidance"
echo "- QUICKSTART.md for setup instructions"
echo "- CONTRIBUTING.md for development setup"
echo "- backend/logs/ for detailed logs"
