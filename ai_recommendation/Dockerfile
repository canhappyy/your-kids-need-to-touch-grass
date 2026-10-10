FROM public.ecr.aws/lambda/python:3.12

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock /tmp/build/
RUN uv export \
      --directory /tmp/build \
      --frozen \
      --no-dev \
      --no-emit-project \
      --output-file /tmp/requirements.txt \
    && uv pip install \
      --python /var/lang/bin/python3.12 \
      --target ${LAMBDA_TASK_ROOT} \
      --index https://download.pytorch.org/whl/cpu \
      --index-strategy unsafe-best-match \
      --requirements /tmp/requirements.txt

COPY . ${LAMBDA_TASK_ROOT}/ai_recommendation
RUN PYTHONPATH=${LAMBDA_TASK_ROOT} /var/lang/bin/python3.12 \
      ${LAMBDA_TASK_ROOT}/ai_recommendation/download_models.py

ENV HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    TOKENIZERS_PARALLELISM=false

CMD ["ai_recommendation.handler.handler"]
