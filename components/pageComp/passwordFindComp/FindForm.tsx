"use client";

import CustomCheckbox from "@/components/element/CustomCheckbox";
import CustomInput from "@/components/element/CustomInput";
import CustomLoadingCircle from "@/components/element/CustomLoadingCircle";
import { Flex } from "@chakra-ui/react";
import { useRef, useState } from "react";

interface ErrorObj {
  error: boolean;
  msg: string;
}

const FindForm = () => {
  const [isVerify, setIsVerify] = useState<boolean>(false);
  const [isSee, setIsSee] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [verifyErrorObj, setVerifyErrorObj] = useState<ErrorObj>({
    error: false,
    msg: "",
  });
  const emailRef = useRef<HTMLInputElement>(null);
  const emailSubTitleRef = useRef<HTMLInputElement>(null);
  const verifyCodeInputRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const intervalId = useRef<NodeJS.Timeout>();
  const isSend = useRef<boolean>(false);

  const emailVerifyFunc = async () => {
    if (!(emailRef.current instanceof HTMLInputElement)) return;
    if (isSend.current) return alert("이미 발송했습니다");
    if (isVerify) return alert("이미인증되셨습니다");
    if (!emailRef.current.value) return alert("이메일을 입력해주세요");
    if (!/[a-z0-9]+@naver.com/.test(emailRef.current.value))
      return alert("공직자메일을 입력해주세요");
    setIsLoading(true);
    const res = await fetch(
      `/api/users/emailCode?userEmail=${
        emailRef.current.value
      }&isChange=${true}`
    );
    isSend.current = true;
    emailRef.current.disabled = true;
    setIsLoading(false);
    alert("이메일을 발송했습니다. 1분정도 걸릴수 있습니다.");
    const json = await res.json();
    if (json.isOk) {
      const end = new Date().setMinutes(new Date().getMinutes() + 2);
      clearInterval(intervalId.current);
      intervalId.current = setInterval(() => {
        const distance = (end - new Date().getTime()) / 1000;
        if (!emailSubTitleRef.current || !emailRef.current) return;
        emailSubTitleRef.current.innerText = `${Math.trunc(
          distance / 60
        )}분 ${Math.floor(distance % 60)}초 남았습니다.`;
        if (distance < 0) {
          emailSubTitleRef.current.innerText = `제한시간이 종료됐습니다`;
          clearInterval(intervalId.current);
          emailRef.current.disabled = false;
          isSend.current = false;
        }
      }, 1000);
    } else {
      switch (json.msg) {
        case "Internet":
          alert("인터넷을 확인해주세요");
          break;
        case "Not Sended":
          alert("메일주소를 다시 확인해주세요");
          break;
        case "redundant":
          alert("메일 한개당 한개의 계정만 만들수 있습니다");
          break;
        case "notFound":
          alert("해당메일로 등록된 계정이 없습니다.");
          break;
        default:
          alert("서버에서 에러가 발생했습니다. 잠시후 다시 시도해주세요");
      }
      emailRef.current.disabled = false;
    }
  };

  const verify = async () => {
    if (isVerify) return alert("이미 인증되셨습니다");
    if (!verifyCodeInputRef.current || !emailRef.current)
      return alert("새로고침해주세요");
    const clientCode = verifyCodeInputRef.current.value;
    setIsLoading(true);
    const result = await fetch("/api/users/emailCode/verify", {
      method: "POST",
      body: JSON.stringify({
        code: clientCode,
        userId: emailRef.current.value,
      }),
    });
    setIsLoading(false);
    const json = await result.json();

    if (json.isOk) {
      if (!emailSubTitleRef.current) return;
      alert("인증번호가 일치합니다");
      emailSubTitleRef.current.innerText = "인증완료";
      verifyCodeInputRef.current.disabled = true;
      setIsVerify(true);
      setVerifyErrorObj({ error: false, msg: "인증완료" });
      clearInterval(intervalId.current);
    } else {
      setVerifyErrorObj({ error: true, msg: "인증번호가 다릅니다" });
    }
  };

  const pwChange = async () => {
    if (!pwRef.current || !emailRef.current || !verifyCodeInputRef.current)
      return;
    if (!isVerify) return alert("이메일인증을 진행해주세요");
    setIsLoading(true);
    const pw = pwRef.current.value;
    const email = emailRef.current.value;
    const code = verifyCodeInputRef.current.value;
    const result = await fetch("/api/users/password", {
      method: "PATCH",
      body: JSON.stringify({
        pw,
        email,
        code,
      }),
    });
    setIsLoading(false);
    const json = await result.json();

    if (json.isOk) {
      alert("비밀번호 변경완료!");
      window.close();
    } else {
      alert("서버에서 에러가 발생했습니다. 잠시후 다시 시도해주세요");
    }
  };

  return (
    <Flex gap={"12px"} direction={"column"}>
      <CustomInput
        title='이메일'
        buttonText={"확인"}
        buttonEvent={emailVerifyFunc}
        inputRef={emailRef}
        subTitleRef={emailSubTitleRef}
      />
      <CustomInput
        title='인증코드'
        errorObj={verifyErrorObj}
        inputRef={verifyCodeInputRef}
        buttonEvent={verify}
        buttonText={"인증하기"}
      />
      {isVerify && (
        <>
          <CustomInput
            title='새 비밀번호'
            subTitle={"10자 이하로 작성해주세요(숫자, 영문만 가능)"}
            buttonText={"변경"}
            isText={isSee}
            buttonEvent={pwChange}
            inputRef={pwRef}
          />
          <CustomCheckbox
            isSmall={true}
            label='비밀번호보기'
            checked={isSee}
            setChecked={setIsSee}
            paddingRight={"4px"}
            marginTop={"0px"}
          />
        </>
      )}
      {isLoading && <CustomLoadingCircle isBig={true} />}
    </Flex>
  );
};

export default FindForm;
